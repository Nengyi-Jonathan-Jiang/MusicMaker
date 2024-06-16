import {ContinuousDynamicsCommand} from "@/app/logic/voiceData";
import {ScoreEditor} from "@/app/logic/editor/scoreEditor";
import {createArray} from "@/app/lib/utils/util";
import {NUM_VOICES} from "@/app/logic/Constants";
import {Range} from "@/app/lib/utils/range";
import {ArrayView} from "@/app/lib/utils/arrayView";
import {ScoreEditorComponent} from "@/app/logic/editor/scoreEditorComponent";

class ContinuousDynamicsEditorInteraction {
    public readonly command: ContinuousDynamicsCommand;
    public readonly voice: number;
    public lastUpdatedColumn: number;

    constructor(voice: number, column: number, command: ContinuousDynamicsCommand) {
        this.voice = voice;
        this.command = command;
        this.lastUpdatedColumn = column;
    }
}

export class ContinuousDynamicsEditor extends ScoreEditorComponent {
    private currentInteraction: ContinuousDynamicsEditorInteraction | null;

    private readonly uiUpdateCallbacks: (null | (() => void))[];
    private readonly pendingUIUpdates: Set<number>;

    public hairpinIntervals: (Range | null)[][];

    public constructor(editor: ScoreEditor) {
        super(editor);

        this.uiUpdateCallbacks = createArray(editor.scoreData.length, null);
        this.pendingUIUpdates = new Set;

        this.currentInteraction = null;

        this.hairpinIntervals = createArray(NUM_VOICES, () => createArray(editor.scoreData.length,null));

        for (let voice = 0; voice < NUM_VOICES; voice++) {
            this.recalculateHairpinsInInterval(voice, Range.forIndicesOf(this));
        }
    }

    private recalculateHairpinsInInterval(voice: number, range: Range): void {
        const {None} = ContinuousDynamicsCommand;

        // Recalculate hairpin start and end

        this.resetHairpinsInRange(voice, range);

        let currentHairpinStart = -1;
        let currentHairpinEnd = -1;
        let currentDynamicCommand = None;

        for (const col of range) {
            const command = this.getCommandForVoice(voice, col);
            if (command === None) {
                if (currentDynamicCommand !== None) {
                    this.writeHairpinStartEndInRange(voice, new Range(currentHairpinStart, currentHairpinEnd));
                }

                currentHairpinStart = currentHairpinEnd = -1;
            }
            else if (command !== currentDynamicCommand) {
                if (currentDynamicCommand !== None) {
                    this.writeHairpinStartEndInRange(voice, new Range(currentHairpinStart, currentHairpinEnd));
                }
                currentHairpinStart = currentHairpinEnd = col;
            }
            else {
                currentHairpinEnd = col;
            }

            currentDynamicCommand = command;
        }
        if (currentDynamicCommand !== None) {
            this.writeHairpinStartEndInRange(voice, new Range(currentHairpinStart, currentHairpinEnd));
        }
    }

    public clearContinuousDynamics() {
        for (let voice = 0; voice < NUM_VOICES; voice++) {
            for (const col of Range.forIndicesOf(this)) {
                this.setCommandForVoice(voice, col, ContinuousDynamicsCommand.None);
            }
            this.resetHairpinsInRange(voice, Range.forIndicesOf(this));
        }
        this.applyUIUpdates();
    }

    startInteraction(column: number, command: ContinuousDynamicsCommand) {
        this.currentInteraction = new ContinuousDynamicsEditorInteraction(
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

    private getVoiceData(voice: number) {
        return this.scoreData.voiceData[voice];
    }

    private setCommandForVoice(voice: number, column: number, command: ContinuousDynamicsCommand) {
        if (!Range.forIndicesOf(this).includes(column)) return;

        this.getVoiceData(voice).setContinuousDynamics(column, command);
    }

    private getCommandForVoice(voice: number, column: number) {
        if (!Range.forIndicesOf(this).includes(column)) {
            return ContinuousDynamicsCommand.None;
        }
        return this.getVoiceData(voice).getContinuousDynamics(column);
    }

    private applyUIUpdates() {
        for (const column of this.pendingUIUpdates) {
            const callback = this.uiUpdateCallbacks[column];
            if (callback) {
                callback();
            }
        }
        this.pendingUIUpdates.clear();
    }

    public getHairpinInterval(voice: number, col: number) {
        if (!Range.forIndicesOf(this).includes(col)) {
            return null;
        }
        return this.hairpinIntervals[voice][col]
    }

    private writeHairpinStartEndInRange(voice: number, range: Range) {

        new ArrayView(this.hairpinIntervals[voice], range).modifyEach((value) => {
            return value && this.pendingUIUpdates.add(value.start), range;
        })

        this.pendingUIUpdates.add(range.start);
    }

    private resetHairpinsInRange(voice: number, range: Range) {
        new ArrayView(this.hairpinIntervals[voice], range).modifyEach((value) => {
            return value && this.pendingUIUpdates.add(value.start), null;
        })
    }

    private updateInteraction(column: number) {
        if (this.currentInteraction === null) return;

        const voice = this.currentInteraction.voice;
        const command = this.currentInteraction.command;

        const updateInterval = Range.fromEndpoints(this.currentInteraction.lastUpdatedColumn, column);

        this.currentInteraction.lastUpdatedColumn = column;

        const intervalToRecalculate = updateInterval.copy();

        for (const col of updateInterval) {
            this.setCommandForVoice(voice, col, command);
        }

        const intervalBefore = this.getHairpinInterval(voice, updateInterval.start - 1);
        if (intervalBefore && intervalBefore.start !== -1) {
            intervalToRecalculate.start = intervalBefore.start;
        }
        const intervalAfter = this.getHairpinInterval(voice, updateInterval.end + 1);
        if (intervalAfter && intervalAfter.end !== -1) {
            intervalToRecalculate.end = intervalAfter.end;
        }

        this.recalculateHairpinsInInterval(voice, intervalToRecalculate);
        this.applyUIUpdates();
    }
}