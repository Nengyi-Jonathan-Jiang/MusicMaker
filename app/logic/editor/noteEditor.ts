import {createArray} from "@/app/lib/utils/util";
import {NUM_NOTES, NUM_VOICES} from "@/app/logic/Constants";
import {NoteCommand} from "@/app/logic/voiceData";
import {ScoreEditor} from "@/app/logic/editor/scoreEditor";
import {Range} from "@/app/lib/utils/range";
import {ScoreEditorComponent} from "@/app/logic/editor/scoreEditorComponent";

export enum NoteEditorInteractionType {
    None = "",
    Blend = "blend", Write = "write", Erase = "erase"
}

export class NoteEditor extends ScoreEditorComponent {

    private currentInteraction: NoteEditorInteraction | null;

    // Callbacks that let us manually update relevant parts of UI after operations
    // This requires some "illegal" use of React hooks, but it is much more efficient
    private readonly uiUpdateCallbacks: (null | (() => void))[][];
    private readonly pendingUIUpdates: { columnIndex: number, noteIndex: number }[];

    private snapInterval: number;

    public constructor(editor: ScoreEditor) {
        super(editor);
        this.snapInterval = 1;

        this.uiUpdateCallbacks = createArray(editor.scoreData.length, () => createArray(NUM_NOTES, null));
        this.pendingUIUpdates = [];

        this.currentInteraction = null;
    }
    
    public clearNotes() {
        for (let voice = 0; voice < NUM_VOICES; voice++) {
            for (let col = 0; col < this.length; col++) {
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

    public startInteractionAt(columnIndex: number, noteIndex: number, interactionType : NoteEditorInteractionType) {
        this.currentInteraction = new NoteEditorInteraction(
            interactionType,
            noteIndex,
            columnIndex,
            this.editor.activeVoice,
            this.snapInterval
        );

        this.updateInteractionEndCol(columnIndex);
        this.applyUIUpdates();
    }

    public endInteraction() {
        this.currentInteraction = null;
        this.applyUIUpdates();
    }

    public moveInteractionColumnTo(columnIndex: number) {
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

    private getVoiceData(voiceIndex: number) {
        return this.scoreData.voiceData[voiceIndex];
    }

    private setCommandForVoice(voice: number, column: number, note: number, command: NoteCommand) {
        if (column < 0 || column >= this.length || note < 0 || note >= NUM_NOTES) {
            return;
        }

        const oldCommand = this.getVoiceData(voice).getNoteCommand(column, note).command;
        if (command !== oldCommand) {
            this.getVoiceData(voice).setNoteCommand(column, note, command);
            this.pendingUIUpdates.push({columnIndex: column, noteIndex: note});
        }
    }

    public getCommandFor(voice: number, column: number, note: number) {
        if (column < 0 || column >= this.length || note < 0 || note >= NUM_NOTES) {
            return NoteCommand.None;
        }
        return this.getVoiceData(voice).getNoteCommand(column, note).command;
    }

    private applyUIUpdates() {
        for (const {columnIndex, noteIndex} of this.pendingUIUpdates.splice(0, Number.POSITIVE_INFINITY)) {
            const callback = this.uiUpdateCallbacks[columnIndex][noteIndex];
            if (callback !== null) {
                callback();
            }
        }
    }

    // TODO: refactor to have less nesting
    private applyBoundary(voiceIndex: number, col: number, note: number, type: NoteEditorBoundaryType) {
        const currCommand = this.getCommandFor(voiceIndex, col, note);
        let newCommand = currCommand;

        // noinspection FallThroughInSwitchStatementJS
        switch (type) {
            case NoteEditorBoundaryType.BlendStart:
                if (this.getCommandFor(voiceIndex, col - 1, note) !== 0) {
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
                if (this.getCommandFor(voiceIndex, col + 1, note) !== 0) {
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

    private eraseRange(voiceIndex: number, colRange: Range, note: number) {
        colRange.forEach(col => this.setCommandForVoice(voiceIndex, col, note, NoteCommand.None));
    }

    private writeRange(voiceIndex: number, colRange: Range, note: number) {
        colRange.forEach(col => this.setCommandForVoice(voiceIndex, col, note, NoteCommand.HoldNote));
    }

    private updateInteractionEndCol(columnIndex: number) {
        if(this.currentInteraction === null) return;
        const {voice, note} = this.currentInteraction;

        const oldColRange = this.currentInteraction.columnRange;
        this.currentInteraction.endColumn = columnIndex;
        const newColRange = this.currentInteraction.columnRange;

        switch (this.currentInteraction.type) {
            case 'blend':
                this.writeRange(voice, newColRange, note);
                this.blendNotesAtRangeEndpoints(voice, newColRange, note);
                break;
            case 'erase':
                this.eraseRange(voice, newColRange, note);

                this.applyBoundary(voice, newColRange.start - 1, note, NoteEditorBoundaryType.BlendEnd);
                this.applyBoundary(voice, newColRange.end + 1, note, NoteEditorBoundaryType.BlendStart);
                break;
            case 'write': {
                this.eraseRange(voice, oldColRange, note);
                this.writeRange(voice, newColRange, note);
                this.separateNotesAtRangeEndpoints(voice, newColRange, note);
            }
        }
    }

    private separateNotesAtRangeEndpoints(voice: number, newColRange: Range, note: number) {
        this.applyBoundary(voice, newColRange.start, note, NoteEditorBoundaryType.Start);
        this.applyBoundary(voice, newColRange.end, note, NoteEditorBoundaryType.End);
        this.applyBoundary(voice, newColRange.start - 1, note, NoteEditorBoundaryType.End);
        this.applyBoundary(voice, newColRange.end + 1, note, NoteEditorBoundaryType.Start);
    }

    private blendNotesAtRangeEndpoints(voice: number, newColRange: Range, note: number) {
        this.applyBoundary(voice, newColRange.start, note, NoteEditorBoundaryType.BlendStart);
        this.applyBoundary(voice, newColRange.end, note, NoteEditorBoundaryType.BlendEnd);
        this.applyBoundary(voice, newColRange.start - 1, note, NoteEditorBoundaryType.BlendEnd);
        this.applyBoundary(voice, newColRange.end + 1, note, NoteEditorBoundaryType.BlendStart);
    }
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

    private readonly columnSnappingInterval: number;

    constructor(interactionType: NoteEditorInteractionType, interactionNote: number, interactionColumn: number, interactionVoice: number, snappingInterval: number) {
        this.type = interactionType;
        this.note = interactionNote;
        this.columnSnappingInterval = snappingInterval;
        this.startColumn = this.endColumn = interactionColumn;
        this.voice = interactionVoice;
    }

    private snapStart(col: number) {
        return col - (col % this.columnSnappingInterval);
    }

    private snapEnd(col: number) {
        return col - (col % this.columnSnappingInterval) + this.columnSnappingInterval - 1;
    }

    get columnRange() {
        return Range.fromEndpoints(this.startColumn, this.endColumn)
            .modifyStart(start => this.snapStart(start))
            .modifyEnd(end => this.snapEnd(end))
    }
}
