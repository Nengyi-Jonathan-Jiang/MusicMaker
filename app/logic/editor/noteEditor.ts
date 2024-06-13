import {ScoreData} from "@/app/logic/scoreData";
import {createArray} from "@/app/lib/util";
import {NUM_NOTES, NUM_VOICES} from "@/app/logic/Constants";
import {NoteCommand} from "@/app/logic/voiceData";
import {ScoreEditor} from "@/app/logic/editor/scoreEditor";

export enum NoteEditorInteractionType {
    None = "",
    Blend = "blend", Write = "write", Erase = "erase"
}

enum NoteEditorBoundaryType {
    Start,
    End,
    BlendStart,
    BlendEnd
}

class NoteEditorInteraction {
    public readonly type: NoteEditorInteractionType;
    public readonly  note: number;
    public readonly  startColumn: number;
    public endColumn: number;
    public readonly  voice: number;

    constructor(interactionType: NoteEditorInteractionType, interactionNote: number, interactionColumn: number, interactionVoice: number) {
        this.type = interactionType;
        this.note = interactionNote;
        this.startColumn = this.endColumn = interactionColumn;
        this.voice = interactionVoice;
    }
}

export class NoteEditor {
    private currentInteraction: NoteEditorInteraction | null;

    private readonly uiUpdateCallbacks: (null | (() => void))[][];
    private readonly pendingUIUpdates: { columnIndex: number, noteIndex: number }[];

    private snapInterval: number;

    private readonly editor: ScoreEditor;

    public constructor(editor: ScoreEditor) {
        this.editor = editor;
        this.snapInterval = 1;

        this.uiUpdateCallbacks = createArray(editor.scoreData.length, () => createArray(NUM_NOTES, null));
        this.pendingUIUpdates = [];

        this.currentInteraction = null;
    }

    public get scoreData() {
        return this.editor.scoreData;
    }

    public clearNotes() {
        for (let voice = 0; voice < NUM_VOICES; voice++) {
            for (let col = 0; col < this.scoreData.length; col++) {
                for (let note = 0; note < NUM_NOTES; note++) {
                    this.setCommandForVoice(voice, col, note, 0);
                }
            }
        }
        this.applyUIUpdates();
    }

    public useSnappingInterval(snapInterval: number) {
        this.snapInterval = snapInterval;
    }

    startInteraction(columnIndex: number, noteIndex: number, interactionType : NoteEditorInteractionType) {
        this.currentInteraction = new NoteEditorInteraction(
            interactionType,
            noteIndex,
            columnIndex,
            this.editor.activeVoice
        );

        this.updateInteractionEndCol(columnIndex);
        this.applyUIUpdates();
    }

    endInteraction() {
        this.currentInteraction = null;
        this.applyUIUpdates();
    }

    mouseEnterColumn(columnIndex: number) {
        if (this.currentInteraction === null) return;

        this.updateInteractionEndCol(columnIndex);
        this.applyUIUpdates();
    }

    setUIUpdateCallback(columnIndex: number, noteIndex: number, callback: () => void) {
        this.uiUpdateCallbacks[columnIndex][noteIndex] = callback;
    }


    private snapStart(col: number) {
        return col - (col % this.snapInterval);
    }

    private snapEnd(col: number) {
        return col - (col % this.snapInterval) + this.snapInterval - 1;
    }

    private sortAndSnapRange(a: number, b : number) : [number, number] {
        return [
            this.snapStart(Math.min(a, b)),
            this.snapEnd(Math.max(a, b)),
        ]
    }

    private getVoiceData(voiceIndex: number) {
        return this.scoreData.voiceData[voiceIndex];
    }

    private setCommandForVoice(voiceIndex: number, columnIndex: number, noteIndex: number, command: NoteCommand) {
        if (columnIndex < 0 || columnIndex >= this.scoreData.length || noteIndex < 0 || noteIndex >= NUM_NOTES) {
            return;
        }

        const oldCommand = this.getVoiceData(voiceIndex).getNoteCommand(columnIndex, noteIndex).command;
        if (command !== oldCommand) {
            this.getVoiceData(voiceIndex).setNoteCommand(columnIndex, noteIndex, command);
            this.pendingUIUpdates.push({columnIndex, noteIndex});
        }
    }

    private getCommandForVoice(voiceIndex: number, columnIndex: number, noteIndex: number) {
        if (columnIndex < 0 || columnIndex >= this.scoreData.length || noteIndex < 0 || noteIndex >= NUM_NOTES) {
            return NoteCommand.Empty;
        }
        return this.getVoiceData(voiceIndex).getNoteCommand(columnIndex, noteIndex).command;
    }

    private applyUIUpdates() {
        for (const {columnIndex, noteIndex} of this.pendingUIUpdates.splice(0, Number.POSITIVE_INFINITY)) {
            const callback = this.uiUpdateCallbacks[columnIndex][noteIndex];
            if (callback !== null) {
                callback();
            }
        }
    }

    private applyBoundary(voiceIndex: number, col: number, note: number, type: NoteEditorBoundaryType) {
        const currCommand = this.getCommandForVoice(voiceIndex, col, note);
        let newCommand = currCommand;

        // noinspection FallThroughInSwitchStatementJS
        switch (type) {
            case NoteEditorBoundaryType.BlendStart:
                if (this.getCommandForVoice(voiceIndex, col - 1, note) !== 0) {
                    switch (currCommand) {
                        case NoteCommand.BeginNote:
                            newCommand = NoteCommand.HoldNote;
                            break;
                        case NoteCommand.ShortNote:
                            newCommand = NoteCommand.EndNote;
                            break;
                    }
                    break;
                }
            case NoteEditorBoundaryType.Start:
                switch (currCommand) {
                    case NoteCommand.EndNote:
                        newCommand = NoteCommand.ShortNote;
                        break;
                    case NoteCommand.HoldNote:
                        newCommand = NoteCommand.BeginNote;
                        break;
                }
                break;
            case NoteEditorBoundaryType.BlendEnd:
                if (this.getCommandForVoice(voiceIndex, col + 1, note) !== 0) {
                    switch (currCommand) {
                        case NoteCommand.EndNote:
                            newCommand = NoteCommand.HoldNote;
                            break;
                        case NoteCommand.ShortNote:
                            newCommand = NoteCommand.BeginNote;
                            break;
                    }
                    break;
                }
            case NoteEditorBoundaryType.End:
                switch (currCommand) {
                    case NoteCommand.BeginNote:
                        newCommand = NoteCommand.ShortNote;
                        break;
                    case NoteCommand.HoldNote:
                        newCommand = NoteCommand.EndNote;
                        break;
                }
                break;
        }
        this.setCommandForVoice(voiceIndex, col, note, newCommand);
    }

    private eraseRange(voiceIndex: number, startCol: number, endCol: number, note: number) {
        for (let col = startCol; col <= endCol; col++) {
            this.setCommandForVoice(voiceIndex, col, note, 0);
        }
    }

    private writeRange(voiceIndex: number, startCol: number, endCol: number, note: number) {
        for (let col = startCol; col <= endCol; col++) {
            this.setCommandForVoice(voiceIndex, col, note, NoteCommand.HoldNote);
        }
    }

    private updateInteractionEndCol(columnIndex: number) {
        if(this.currentInteraction === null) return;

        const voice = this.currentInteraction.voice;

        const [oldStartCol, oldEndCol] = this.sortAndSnapRange(this.currentInteraction.startColumn, this.currentInteraction.endColumn);
        const note = this.currentInteraction.note;

        this.currentInteraction.endColumn = columnIndex;

        const [newStartCol, newEndCol] = this.sortAndSnapRange(this.currentInteraction.startColumn, this.currentInteraction.endColumn);

        switch (this.currentInteraction.type) {
            case 'blend':
                this.writeRange(voice, newStartCol, newEndCol, note);

                this.applyBoundary(voice, newStartCol, note, NoteEditorBoundaryType.Start);
                this.applyBoundary(voice, newEndCol, note, NoteEditorBoundaryType.End);
                this.applyBoundary(voice, newStartCol, note, NoteEditorBoundaryType.BlendStart);
                this.applyBoundary(voice, newEndCol, note, NoteEditorBoundaryType.BlendEnd);
                this.applyBoundary(voice, newStartCol - 1, note, NoteEditorBoundaryType.BlendEnd);
                this.applyBoundary(voice, newEndCol + 1, note, NoteEditorBoundaryType.BlendStart);
                break;
            case 'erase':
                this.eraseRange(voice, newStartCol, newEndCol, note);

                this.applyBoundary(voice, newStartCol - 1, note, NoteEditorBoundaryType.BlendEnd);
                this.applyBoundary(voice, newEndCol + 1, note, NoteEditorBoundaryType.BlendStart);
                break;
            case 'write': {
                this.eraseRange(voice, oldStartCol, oldEndCol, note);

                this.writeRange(voice, newStartCol, newEndCol, note);
                this.applyBoundary(voice, newStartCol, note, NoteEditorBoundaryType.Start);
                this.applyBoundary(voice, newEndCol, note, NoteEditorBoundaryType.End);
                this.applyBoundary(voice, newStartCol - 1, note, NoteEditorBoundaryType.End);
                this.applyBoundary(voice, newEndCol + 1, note, NoteEditorBoundaryType.Start);
            }
        }
    }
}