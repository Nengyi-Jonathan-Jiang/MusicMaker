import {DynamicsCommand} from "@/app/logic/voiceData";
import {ScoreEditor} from "@/app/logic/editor/scoreEditor";
import {createArray} from "@/app/lib/util";
import {NUM_VOICES} from "@/app/logic/Constants";

class DynamicsEditorInteraction {
    public readonly command: DynamicsCommand;
    public readonly  voice: number;
    public lastUpdatedColumn: number;

    constructor(voice: number, column: number, command : DynamicsCommand) {
        this.voice = voice;
        this.command = command;
        this.lastUpdatedColumn = column - 1;
    }
}

export class DynamicsEditor {
    private currentInteraction: DynamicsEditorInteraction | null;

    private readonly uiUpdateCallbacks: (null | (() => void))[];
    private readonly pendingUIUpdates: number[];

    private readonly editor: ScoreEditor;

    public hairpinStart : number[][] = [];
    public hairpinEnd : number[][] = [];

    public constructor(editor: ScoreEditor) {
        this.editor = editor;

        this.uiUpdateCallbacks = createArray(editor.scoreData.length, null);
        this.pendingUIUpdates = [];

        this.currentInteraction = null;

        this.recalculateHairpinStartEnd();
    }

    private recalculateHairpinStartEnd() : void {
        const {None} = DynamicsCommand;

        // Recalculate hairpin start and end
        this.hairpinStart = createArray(NUM_VOICES, () => createArray(this.editor.scoreData.length, -1));
        this.hairpinEnd = createArray(NUM_VOICES, () => createArray(this.editor.scoreData.length, -1));
        for(let voice = 0; voice < NUM_VOICES; voice++) {
            let currentHairpinStart = -1;
            let currentHairpinEnd = -1;
            let currentDynamicCommand = None;
            for(let column = 0; column < this.editor.scoreData.length; column++) {
                let command = this.getCommandForVoice(voice, column);
                if (command === None) {
                    if(currentDynamicCommand !== None) {
                        this.writeHairpinStartEnd(voice, currentHairpinStart, currentHairpinEnd, currentHairpinStart, currentHairpinEnd);
                    }

                    currentHairpinStart = currentHairpinEnd = -1;
                    currentDynamicCommand = None;
                    continue;
                }
                if (command !== currentDynamicCommand) {
                    if(currentDynamicCommand !== None) {
                        this.writeHairpinStartEnd(voice, currentHairpinStart, currentHairpinEnd, currentHairpinStart, currentHairpinEnd);
                    }

                    currentDynamicCommand = command;
                    currentHairpinStart = currentHairpinEnd = column;
                    continue;
                }

                currentHairpinEnd = column;
            }
            if(currentDynamicCommand !== None) {
                this.writeHairpinStartEnd(voice, currentHairpinStart, currentHairpinEnd, currentHairpinStart, currentHairpinEnd);
            }

            console.log(this.hairpinStart[voice], this.hairpinEnd[voice]);

            if(voice < 0.5) {
                break;
            }
        }
    }

    public recalculate___TEMP___() {
        this.recalculateHairpinStartEnd();
    }

    public get scoreData() {
        return this.editor.scoreData;
    }


    public clearDynamics() {
        for (let voice = 0; voice < NUM_VOICES; voice++) {
            for (let col = 0; col < this.scoreData.length; col++) {
                this.setCommandForVoice(voice, col, DynamicsCommand.None);
            }
        }
        this.applyUIUpdates();
    }

    startInteraction(columnIndex: number, command: DynamicsCommand) {
        this.currentInteraction = new DynamicsEditorInteraction(
            this.editor.activeVoice,
            columnIndex,
            command
        );

        this.mouseEnterColumn(columnIndex);

        this.applyUIUpdates();
    }

    endInteraction() {
        this.currentInteraction = null;
        this.applyUIUpdates();
    }

    mouseEnterColumn(columnIndex: number) {
        if (this.currentInteraction === null) return;

        this.updateInteraction(columnIndex);
        this.applyUIUpdates();
    }

    setUIUpdateCallback(columnIndex: number, callback: () => void) {
        this.uiUpdateCallbacks[columnIndex] = callback;
    }

    private sortRange(a: number, b : number) : [number, number] {
        return [
            Math.min(a, b),
            Math.max(a, b),
        ]
    }

    private getVoiceData(voiceIndex: number) {
        return this.scoreData.voiceData[voiceIndex];
    }

    private setCommandForVoice(voiceIndex: number, columnIndex: number, command: DynamicsCommand) {
        if (columnIndex < 0 || columnIndex >= this.scoreData.length) return;

        this.getVoiceData(voiceIndex).setDynamicCommand(columnIndex, command);
    }

    private getCommandForVoice(voiceIndex: number, columnIndex: number) {
        if (columnIndex < 0 || columnIndex >= this.scoreData.length) {
            return DynamicsCommand.None;
        }
        return this.getVoiceData(voiceIndex).getDynamicCommand(columnIndex);
    }

    private applyUIUpdates() {
        for (const columnIndex of this.pendingUIUpdates.splice(0, Number.POSITIVE_INFINITY)) {
            const callback = this.uiUpdateCallbacks[columnIndex];
            if (callback !== null) {
                callback();
            }
        }
    }

    private writeRange(voiceIndex: number, startCol: number, endCol: number, command: DynamicsCommand) {
        for (let col = startCol; col <= endCol; col++) {
            this.setCommandForVoice(voiceIndex, col, command);
        }
    }

    private writeHairpinStartEnd(voiceIndex: number, startCol: number, endCol: number, start: number, end: number) {
        for (let col = startCol; col <= endCol; col++) {
            if(col < 0 || col >= this.editor.scoreData.length) continue;

            this.hairpinStart[voiceIndex][col] = start;
            this.hairpinEnd[voiceIndex][col] = end;
        }
    }

    private eraseRange(voiceIndex: number, startCol: number, endCol: number) {
        for (let col = startCol; col <= endCol; col++) {
            this.setCommandForVoice(voiceIndex, col, DynamicsCommand.None);
        }
    }

    private updateInteraction(columnIndex: number) {
        if(this.currentInteraction === null) return;

        const voice = this.currentInteraction.voice;
        const command = this.currentInteraction.command;
        const [start, end] = this.sortRange(
            this.currentInteraction.lastUpdatedColumn,
            columnIndex
        );

        this.currentInteraction.lastUpdatedColumn = columnIndex;

        switch (command) {
            case DynamicsCommand.Crescendo: case DynamicsCommand.Decrescendo:
                let hairpinStart = start;
                let hairpinEnd = end;

                this.writeRange(voice, start, end, command);
                // Merge with hairpin before
                if(this.getCommandForVoice(voice, start - 1) === command) {
                    hairpinStart = this.hairpinStart[voice][start - 1];
                }
                else if(this.getCommandForVoice(voice, start - 1) !== DynamicsCommand.None){

                }
                if(this.getCommandForVoice(voice, end + 1) === command) {
                    hairpinStart = this.hairpinEnd[voice][end + 1];
                }
                this.writeHairpinStartEnd(voice, hairpinStart, hairpinEnd, hairpinStart, hairpinEnd);

                break;
            case DynamicsCommand.None:
                this.eraseRange(voice, start, end);
                break;
        }
    }
}