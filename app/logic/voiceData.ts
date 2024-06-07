import {createArray} from "@/app/lib/util";
import {ScoreData} from "@/app/logic/scoreData";
import {Instrument} from "@/app/logic/instrument";

export class VoiceData {
    readonly #data: VoiceCommand[][];
    #instrument: Instrument;

    constructor(length: number) {
        this.#instrument = new Instrument();
        this.#data = createArray(length, () => createArray(ScoreData.NUM_NOTES, VoiceCommand.Empty));
    }

    getCommand(column: number, noteIndex: number) {
        const command = this.#data[column][noteIndex];
        return {
            doBegin: command === VoiceCommand.BeginNote || command === VoiceCommand.ShortNote,
            doEnd: command === VoiceCommand.ShortNote || command === VoiceCommand.EndNote,
            command
        }
    }

    setCommand(column: number, note: number, command: VoiceCommand) {
        this.#data[column][note] = command;
    }

    get instrument() : Instrument {
        return this.#instrument;
    }

    set instrument(instrumentType: string) {
        this.#instrument = new Instrument(instrumentType);
    }
}

export enum VoiceCommand {
    Empty,
    BeginNote,
    HoldNote,
    EndNote,
    ShortNote,
}