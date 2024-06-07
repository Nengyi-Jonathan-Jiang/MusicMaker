import {createArray} from "@/app/lib/util";
import {ScoreData} from "@/app/logic/scoreData";

export class InstrumentData {
    data: InstrumentCommand[][];

    constructor(length: number) {
        this.data = createArray(length, () => createArray(ScoreData.NUM_NOTES, InstrumentCommand.NULL));
    }

    getCommand(column: number, noteIndex: number) {
        const command = this.data[column][noteIndex];
        return {
            doBegin: command === InstrumentCommand.BEGIN || command === InstrumentCommand.DOT,
            doEnd: command === InstrumentCommand.DOT || command === InstrumentCommand.END,
            command
        }
    }

    setCommand(column: number, note: number, command: InstrumentCommand) {
        this.data[column][note] = command;
    }
}

export enum InstrumentCommand {
    NULL,
    BEGIN,
    HOLD,
    END,
    DOT,
}