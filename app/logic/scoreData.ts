import {createArray} from "@/app/lib/util";
import {InstrumentData} from "@/app/logic/instrumentData";

export class ScoreData {
    static get NUM_NOTES() {
        return 88
    }

    static get NUM_VOICES() {
        return 6
    }

    noteData: InstrumentData[];

    length: number;

    bpm: number;

    constructor(length: number) {
        this.length = length;
        this.noteData = createArray(ScoreData.NUM_VOICES, () => new InstrumentData(length));
        this.bpm = 120;
    }
}