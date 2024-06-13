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
        this.hairpinStart = createArray(NUM_VOICES, () => createArray(this.scoreData.length, -1));
        this.hairpinEnd = createArray(NUM_VOICES, () => createArray(this.scoreData.length, -1));
        for(let voice = 0; voice < NUM_VOICES; voice++) {
            let currentHairpinStart = -1;
            let currentHairpinEnd = -1;
            let currentDynamicCommand = None;
            for(let column = 0; column < this.scoreData.length; column++) {
                let command = this.getCommandForVoice(voice, column);
                if (command === None) {
                    if(currentDynamicCommand !== None) {
                        this.writeHairpinStartEnd(voice, currentHairpinStart, currentHairpinEnd);
                    }

                    currentHairpinStart = currentHairpinEnd = -1;
                    currentDynamicCommand = None;
                    continue;
                }
                if (command !== currentDynamicCommand) {
                    if(currentDynamicCommand !== None) {
                        this.writeHairpinStartEnd(voice, currentHairpinStart, currentHairpinEnd);
                    }

                    currentDynamicCommand = command;
                    currentHairpinStart = currentHairpinEnd = column;
                    continue;
                }

                currentHairpinEnd = column;
            }
            if(currentDynamicCommand !== None) {
                this.writeHairpinStartEnd(voice, currentHairpinStart, currentHairpinEnd);
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

    startInteraction(column: number, command: DynamicsCommand) {
        this.currentInteraction = new DynamicsEditorInteraction(
            this.editor.activeVoice,
            column,
            command
        );

        this.mouseEnterColumn(column);

        this.applyUIUpdates();
    }

    endInteraction() {
        this.currentInteraction = null;
        this.applyUIUpdates();
    }

    mouseEnterColumn(column: number) {
        if (this.currentInteraction === null) return;

        this.updateInteraction(column);
        this.applyUIUpdates();
    }

    setUIUpdateCallback(column: number, callback: () => void) {
        this.uiUpdateCallbacks[column] = callback;
    }

    private sortRange(a: number, b : number) : [number, number] {
        return [
            Math.min(a, b),
            Math.max(a, b),
        ]
    }

    private getVoiceData(voice: number) {
        return this.scoreData.voiceData[voice];
    }

    private setCommandForVoice(voice: number, column: number, command: DynamicsCommand) {
        if (column < 0 || column >= this.scoreData.length) return;

        this.getVoiceData(voice).setDynamicCommand(column, command);
    }

    private getCommandForVoice(voice: number, column: number) {
        if (column < 0 || column >= this.scoreData.length) {
            return DynamicsCommand.None;
        }
        return this.getVoiceData(voice).getDynamicCommand(column);
    }

    private applyUIUpdates() {
        for (const column of this.pendingUIUpdates.splice(0, Number.POSITIVE_INFINITY)) {
            const callback = this.uiUpdateCallbacks[column];
            if (callback !== null) {
                callback();
            }
        }
    }

    private writeRange(voice: number, startCol: number, endCol: number, command: DynamicsCommand) {
        for (let col = startCol; col <= endCol; col++) {
            this.setCommandForVoice(voice, col, command);
        }
    }
    
    private getHairpinStartEnd(voice: number, col: number) {
        if(col < 0 || col >= this.scoreData.length) {
            return {
                start: -1,
                end: -1,
                isInRange: false
            };
        }
        return {
            start: this.hairpinStart[voice][col],
            end: this.hairpinEnd[voice][col],
            isInRange: true
        }
    }
    
    private writeHairpinStartEnd(voice: number, startCol: number, endCol: number, reset: boolean = false) {
        for (let col = startCol; col <= endCol; col++) {
            if(col < 0 || col >= this.scoreData.length) continue;
            
            this.hairpinStart[voice][col] = reset ? -1 : startCol;
            this.hairpinEnd[voice][col] = reset ? -1 : endCol;
        }
    }
    
    private safeEraseRange(voice: number, startCol: number, endCol: number) {
        for (let col = startCol; col <= endCol; col++) {
            this.setCommandForVoice(voice, col, DynamicsCommand.None);
        }
        this.writeHairpinStartEnd(voice, startCol, endCol, true);
        if(this.getCommandForVoice(voice, startCol - 1) !== DynamicsCommand.None) {
            let start = this.getHairpinStartEnd(voice, startCol - 1).start;
            this.writeHairpinStartEnd(voice, start, startCol - 1)
        }
        if(this.getCommandForVoice(voice, endCol + 1) !== DynamicsCommand.None) {
            let end = this.getHairpinStartEnd(voice, startCol - 1).end;
            this.writeHairpinStartEnd(voice, endCol + 1, end);
        }
    }

    private updateInteraction(column: number) {
        if(this.currentInteraction === null) return;

        const voice = this.currentInteraction.voice;
        const command = this.currentInteraction.command;
        const [start, end] = this.sortRange(
            this.currentInteraction.lastUpdatedColumn,
            column
        );

        this.currentInteraction.lastUpdatedColumn = column;

        switch (command) {
            case DynamicsCommand.Crescendo: case DynamicsCommand.Decrescendo:
                let hairpinStart = start;
                let hairpinEnd = end;
                
                this.safeEraseRange(voice, start, end);
                this.writeRange(voice, start, end, command);
                // Merge with hairpin before
                if(this.getCommandForVoice(voice, start - 1) === command) {
                    hairpinStart = this.hairpinStart[voice][start - 1];
                }
                if(this.getCommandForVoice(voice, end + 1) === command) {
                    hairpinStart = this.hairpinEnd[voice][end + 1];
                }
                this.writeHairpinStartEnd(voice, hairpinStart, hairpinEnd);

                break;
            case DynamicsCommand.None:
                this.safeEraseRange(voice, start, end);
                break;
        }
        this.applyUIUpdates();
    }
}