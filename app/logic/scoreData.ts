import {createArray} from "@/app/lib/util";
import {VoiceData} from "@/app/logic/voiceData";
import {Instrument} from "@/app/logic/instrument";

export class ScoreData {
    static get NUM_NOTES() {
        return 88
    }

    static get NUM_VOICES() {
        return 6
    }

    noteData: VoiceData[];

    length: number;

    bpm: number;

    constructor(length: number) {
        this.length = length;
        this.noteData = createArray(ScoreData.NUM_VOICES, () => new VoiceData(length));
        this.bpm = 120;
    }
}