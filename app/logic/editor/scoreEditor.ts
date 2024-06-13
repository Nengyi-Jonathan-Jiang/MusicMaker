import {ScoreData} from "@/app/logic/scoreData";
import {ScorePlayer} from "@/app/logic/scorePlayer";
import {Instrument} from "@/app/logic/instrument";
import {IScrollSyncer} from "@/app/lib/scrollSync";
import {NoteEditor} from "@/app/logic/editor/noteEditor";
import {DynamicsEditor} from "@/app/logic/editor/dynamicsEditor";

export class ScoreEditor {

    #activeVoice: number;

    readonly #scoreData: ScoreData;
    readonly #scorePlayer: ScorePlayer;
    readonly #noteEditor: NoteEditor;
    readonly #dynamicsEditor: DynamicsEditor;

    constructor(score_length : number) {
        this.#scoreData = new ScoreData(score_length);
        this.#scorePlayer = new ScorePlayer;
        this.#activeVoice = 0;

        this.#noteEditor = new NoteEditor(this);
        this.#dynamicsEditor = new DynamicsEditor(this);
    }

    clearScore() {
        this.#noteEditor.clearNotes();
    }

    get activeVoice() {
        return this.#activeVoice;
    }

    set activeVoice(voice: number) {
        if (voice === this.activeVoice) return;

        this.#activeVoice = voice;
    }

    get scoreData() {
        return this.#scoreData;
    }

    get noteEditor() {
        return this.#noteEditor;
    }

    get dynamicsEditor() {
        return this.#dynamicsEditor;
    }

    useSnappingInterval(snapInterval: number) {
        this.#noteEditor.useSnappingInterval(snapInterval);
    }

    playScore(syncer: IScrollSyncer) {
        this.#scorePlayer.playAll(this.scoreData, syncer);
    }

    stopPlayScore() {
        this.#scorePlayer.stopPlaying();
    }

    get isPlaying() {
        return this.#scorePlayer.isPlaying;
    }

    get instrumentForActiveVoice() : Instrument {
        return this.#scorePlayer.getInstrument(this.activeVoice);
    }

    set instrumentForActiveVoice(instrument : Instrument) {
        this.#scorePlayer.setInstrument(this.activeVoice, instrument);
    }

    get activeVoiceData() {
        return this.#scoreData.voiceData[this.activeVoice];
    }
}