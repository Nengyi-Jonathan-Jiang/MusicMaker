import {ScoreData} from "@/app/logic/scoreData";
import {ScorePlayer} from "@/app/logic/scorePlayer";
import {createArray} from "@/app/lib/util";
import {Instrument} from "@/app/logic/instrument";
import {InstrumentCommand} from "@/app/logic/instrumentData";

export class ScoreEditor {

    #activeVoice: number;

    _scoreData: ScoreData;

    _scorePlayer: ScorePlayer;

    _UIUpdateCallbacks: (null | (() => void))[][];

    _pendingUIUpdates: { columnIndex: number, noteIndex: number }[];

    _snapInterval: number;

    private interaction: "blend" | "write" | "erase" | null = null;
    private interactionNote: number = 0;
    private interactionStartColumn: number = 0;
    private interactionEndColumn: number = 0;

    constructor(score_length : number) {
        this._scoreData = new ScoreData(score_length);
        this._scorePlayer = new ScorePlayer;
        this.#activeVoice = 0;

        this._UIUpdateCallbacks = createArray(score_length, () => createArray(ScoreData.NUM_NOTES, null));

        this._pendingUIUpdates = [];

        this._snapInterval = 1;
    }

    clearScore() {
        const prevActiveVoice = this.activeVoice;
        for (let voice = 0; voice < ScoreData.NUM_VOICES; voice++) {
            this.activeVoice = voice;
            for (let col = 0; col < this.scoreData.length; col++) {
                for (let note = 0; note < ScoreData.NUM_NOTES; note++) {
                    this._setCommandForActiveVoice(col, note, 0);
                }
            }
        }
        this.activeVoice = prevActiveVoice;
        this._applyUIUpdates();
    }

    get activeVoice() {
        return this.#activeVoice;
    }

    set activeVoice(voice: number) {
        if (voice === this.activeVoice) return;

        this.#activeVoice = voice;
    }

    get scoreData() {
        return this._scoreData;
    }

    useSnappingInterval(snapInterval: number) {
        this._snapInterval = snapInterval;
    }

    _snapStart(col: number) {
        return col - (col % this._snapInterval);
    }

    _snapEnd(col: number) {
        return col - (col % this._snapInterval) + this._snapInterval - 1;
    }

    playScore(el: HTMLDivElement) {
        this._scorePlayer.playAll(this.scoreData, el);
    }

    stopPlayScore() {
        this._scorePlayer.stopPlaying();
    }

    get isPlaying() {
        return this._scorePlayer.isPlaying;
    }

    get instrumentForActiveVoice() {
        return this._scorePlayer.getInstrument(this.activeVoice).name;
    }

    set instrumentForActiveVoice(instrumentName) {
        this._scorePlayer.setInstrument(this.activeVoice, new Instrument(instrumentName));
    }

    startInteraction(columnIndex: number, noteIndex: number, interactionType: 'blend' | 'write' | 'erase') {
        this.interaction = interactionType;
        this.interactionNote = noteIndex;
        this.interactionStartColumn = columnIndex;
        this.interactionEndColumn = columnIndex;

        this._updateInteractionEndCol(columnIndex);
        this._applyUIUpdates();
    }

    endInteraction() {
        this.interaction = null;
        this._applyUIUpdates();
    }

    mouseEnterColumn(columnIndex: number) {
        if (!this.interaction) return;
        this._updateInteractionEndCol(columnIndex);
        this._applyUIUpdates();
    }

    setUIUpdateCallback(columnIndex: number, noteIndex: number, callback: () => void) {
        this._UIUpdateCallbacks[columnIndex][noteIndex] = callback;
    }

    _setCommandForActiveVoice(columnIndex: number, noteIndex: number, command: number) {
        if (columnIndex < 0 || columnIndex >= this.scoreData.length || noteIndex < 0 || noteIndex >= ScoreData.NUM_NOTES) {
            return;
        }

        const oldCommand = this.scoreData.noteData[this.activeVoice].getCommand(columnIndex, noteIndex).command;
        this.scoreData.noteData[this.activeVoice].setCommand(columnIndex, noteIndex, command);
        if (command !== oldCommand) {
            this._pendingUIUpdates.push({columnIndex, noteIndex});
        }
    }

    _getCommandForActiveVoice(columnIndex: number, noteIndex: number) {
        if (columnIndex < 0 || columnIndex >= this.scoreData.length || noteIndex < 0 || noteIndex >= ScoreData.NUM_NOTES) {
            return 0;
        }
        return this.scoreData.noteData[this.activeVoice].getCommand(columnIndex, noteIndex).command;
    }

    _applyUIUpdates() {
        for (const {columnIndex, noteIndex} of this._pendingUIUpdates.splice(0, Number.POSITIVE_INFINITY)) {
            const callback = this._UIUpdateCallbacks[columnIndex][noteIndex];
            if (callback !== null) {
                callback();
            }
        }
    }

    _applyBoundary(col: number, note: number, type: 'start' | 'end' | 'hold-start' | 'hold-end') {
        const currCommand = this._getCommandForActiveVoice(col, note);
        let newCommand = currCommand;

        // noinspection FallThroughInSwitchStatementJS
        switch (type) {
            case "hold-start":
                if (this._getCommandForActiveVoice(col - 1, note) !== 0) {
                    switch (currCommand) {
                        case InstrumentCommand.BEGIN:
                            newCommand = InstrumentCommand.HOLD;
                            break;
                        case InstrumentCommand.DOT:
                            newCommand = InstrumentCommand.END;
                            break;
                    }
                    break;
                }
            case "start":
                switch (currCommand) {
                    case InstrumentCommand.END:
                        newCommand = InstrumentCommand.DOT;
                        break;
                    case InstrumentCommand.HOLD:
                        newCommand = InstrumentCommand.BEGIN;
                        break;
                }
                break;
            case "hold-end":
                if (this._getCommandForActiveVoice(col + 1, note) !== 0) {
                    switch (currCommand) {
                        case InstrumentCommand.END:
                            newCommand = InstrumentCommand.HOLD;
                            break;
                        case InstrumentCommand.DOT:
                            newCommand = InstrumentCommand.BEGIN;
                            break;
                    }
                    break;
                }
            case "end":
                switch (currCommand) {
                    case InstrumentCommand.BEGIN:
                        newCommand = InstrumentCommand.DOT;
                        break;
                    case InstrumentCommand.HOLD:
                        newCommand = InstrumentCommand.END;
                        break;
                }
                break;
        }
        this._setCommandForActiveVoice(col, note, newCommand);
    }

    _eraseRange(startCol: number, endCol: number, note: number) {
        for (let col = startCol; col <= endCol; col++) {
            this._setCommandForActiveVoice(col, note, 0);
        }
    }

    _writeRange(startCol: number, endCol: number, note: number) {
        for (let col = startCol; col <= endCol; col++) {
            this._setCommandForActiveVoice(col, note, InstrumentCommand.HOLD);
        }
    }

    _updateInteractionEndCol(columnIndex: number) {
        const oldStartCol = this._snapStart(Math.min(this.interactionStartColumn, this.interactionEndColumn)),
            oldEndCol = this._snapEnd(Math.max(this.interactionStartColumn, this.interactionEndColumn)),
            note = this.interactionNote;

        this.interactionEndColumn = columnIndex;

        const newStartCol = this._snapStart(Math.min(this.interactionStartColumn, columnIndex)),
            newEndCol = this._snapEnd(Math.max(this.interactionStartColumn, columnIndex));

        switch (this.interaction) {
            case 'blend':
                this._eraseRange(oldStartCol, oldEndCol, note);

                this._writeRange(newStartCol, newEndCol, note);
                this._applyBoundary(newStartCol, note, 'start');
                this._applyBoundary(newEndCol, note, 'end');
                this._applyBoundary(newStartCol, note, 'hold-start');
                this._applyBoundary(newEndCol, note, 'hold-end');
                this._applyBoundary(newStartCol - 1, note, 'hold-end');
                this._applyBoundary(newEndCol + 1, note, 'hold-start');
                break;
            case 'erase':

                this._eraseRange(newStartCol, newEndCol, note);
                this._applyBoundary(newStartCol - 1, note, 'hold-end');
                this._applyBoundary(newEndCol + 1, note, 'hold-start');
                break;
            case 'write': {
                this._eraseRange(oldStartCol, oldEndCol, note);

                this._writeRange(newStartCol, newEndCol, note);
                this._applyBoundary(newStartCol, note, 'start');
                this._applyBoundary(newEndCol, note, 'end');
                this._applyBoundary(newStartCol - 1, note, 'end');
                this._applyBoundary(newEndCol + 1, note, 'start');
            }
        }
    }
}