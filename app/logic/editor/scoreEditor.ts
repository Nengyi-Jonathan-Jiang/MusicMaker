import {ScoreData} from "@/app/logic/scoreData";
import {ScorePlayer} from "@/app/logic/scorePlayer";
import {Instrument} from "@/app/logic/instrument";
import {IScrollSyncer} from "@/app/lib/react-utils/scrollSync";
import {NoteEditor} from "@/app/logic/editor/noteEditor";
import {ContinuousDynamicsEditor} from "@/app/logic/editor/continuousDynamicsEditor";

export class ScoreEditor {

    #activeVoice: number;

    readonly #scoreData: ScoreData;
    readonly #scorePlayer: ScorePlayer;
    readonly #noteEditor: NoteEditor;
    readonly #continuousDynamicsEditor: ContinuousDynamicsEditor;

    constructor(score_length : number) {
        this.#scoreData = new ScoreData(score_length);
        this.#scorePlayer = new ScorePlayer;
        this.#activeVoice = 0;

        this.#noteEditor = new NoteEditor(this);
        this.#continuousDynamicsEditor = new ContinuousDynamicsEditor(this);
    }

    clearScore() {
        this.#noteEditor.clearNotes();
        this.#continuousDynamicsEditor.clearContinuousDynamics();
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

    get continuousDynamicsEditor() {
        return this.#continuousDynamicsEditor;
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