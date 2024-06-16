import {createArray} from "@/app/lib/utils/util";
import {ScoreData} from "@/app/logic/scoreData";
import {Instrument} from "@/app/logic/instrument";
import {NUM_NOTES} from "@/app/logic/Constants";

export class VoiceData {
    readonly #noteCommands: NoteCommand[][];
    readonly #continuousDynamicsCommands: ContinuousDynamicsCommand[];
    readonly #pointDynamicsValues: PointDynamicsValue[];

    constructor(length: number) {
        this.#noteCommands = createArray(length, () => createArray(NUM_NOTES, NoteCommand.None));
        this.#continuousDynamicsCommands = createArray(length, ContinuousDynamicsCommand.None);
        this.#pointDynamicsValues = createArray(length, PointDynamicsValue.None);
    }

    getNoteCommand(column: number, noteIndex: number) {
        const command = this.#noteCommands[column][noteIndex];
        return {
            doBegin: command === NoteCommand.BeginNote || command === NoteCommand.ShortNote,
            doEnd: command === NoteCommand.ShortNote || command === NoteCommand.EndNote,
            command
        }
    }

    setNoteCommand(column: number, note: number, command: NoteCommand) {
        this.#noteCommands[column][note] = command;
    }

    getContinuousDynamics(column: number) {
        return this.#continuousDynamicsCommands[column];
    }

    setContinuousDynamics(column: number, value: ContinuousDynamicsCommand) {
        this.#continuousDynamicsCommands[column] = value;
    }

    getPointDynamics(column: number) {
        return this.#pointDynamicsValues[column];
    }

    setPointDynamics(column: number, value: PointDynamicsValue) {
        this.#pointDynamicsValues[column] = value;
    }
}

export enum NoteCommand {
    None,
    BeginNote,
    HoldNote,
    EndNote,
    ShortNote,
}

export enum ContinuousDynamicsCommand {
    None = "",
    Crescendo = "<",
    Diminuendo = ">",
}

export enum PointDynamicsValue {
    None = '',

    ff = 'ff',
    f = 'f',
    mf = 'mf',
    mp = 'mp',
    p = 'p',
    pp = 'pp',

    n = 'n',
}