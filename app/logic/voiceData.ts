import {createArray} from "@/app/lib/util";
import {ScoreData} from "@/app/logic/scoreData";
import {Instrument} from "@/app/logic/instrument";

export class VoiceData {
    readonly #noteCommands: NoteCommand[][];
    readonly #dynamicsCommands: DynamicsCommand[];
    readonly #dynamicsValues: DynamicsValue[];

    #instrument: Instrument;

    constructor(length: number) {
        this.#instrument = new Instrument();
        this.#noteCommands = createArray(length, () => createArray(ScoreData.NUM_NOTES, NoteCommand.Empty));
        this.#dynamicsCommands = createArray(length, DynamicsCommand.None);
        this.#dynamicsValues = createArray(length, DynamicsValue.None);
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

    getDynamicCommand(column: number) {
        return this.#dynamicsCommands[column];
    }

    setDynamicCommand(column: number, value: DynamicsCommand) {
        this.#dynamicsCommands[column] = value;
    }

    getDynamicValue(column: number) {
        return this.#dynamicsValues[column];
    }

    setDynamicValue(column: number, value: DynamicsValue) {
        this.#dynamicsValues[column] = value;
    }

    get instrument(): Instrument {
        return this.#instrument;
    }

    set instrument(instrumentType: string) {
        this.#instrument = new Instrument(instrumentType);
    }
}

export enum NoteCommand {
    Empty,
    BeginNote,
    HoldNote,
    EndNote,
    ShortNote,
}

export enum DynamicsCommand {
    None = "",
    Crescendo = "<",
    Decrescendo = ">",
}

export enum DynamicsValue {
    None = '',

    ff = 'ff',
    f = 'f',
    mf = 'mf',
    mp = 'mp',
    p = 'p',
    pp = 'pp',

    n = 'n',
}