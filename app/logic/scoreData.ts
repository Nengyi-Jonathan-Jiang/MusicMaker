import {createArray} from "@/app/lib/util";
import {VoiceData} from "@/app/logic/voiceData";
import {Instrument} from "@/app/logic/instrument";
import { NUM_VOICES } from "./Constants";

export class ScoreData {
    public readonly voiceData: VoiceData[];
    public readonly length: number;
    public bpm: number;

    constructor(length: number) {
        this.length = length;
        this.voiceData = createArray(NUM_VOICES, () => new VoiceData(length));
        this.bpm = 120;
    }
}