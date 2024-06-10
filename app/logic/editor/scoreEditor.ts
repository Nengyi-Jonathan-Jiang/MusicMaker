import {ScoreData} from "@/app/logic/scoreData";
import {ScorePlayer} from "@/app/logic/scorePlayer";
import {Instrument} from "@/app/logic/instrument";
import {IScrollSyncer} from "@/app/lib/scrollSync";
import {NoteEditor, NoteEditorInteractionType} from "@/app/logic/editor/noteEditor";

// TODO: split this up

export class DynamicsEditor {

}

export class ScoreEditor {

    #activeVoice: number;

    readonly #scoreData: ScoreData;
    readonly #scorePlayer: ScorePlayer;
    readonly #noteEditor: NoteEditor;

    constructor(score_length : number) {
        this.#scoreData = new ScoreData(score_length);
        this.#scorePlayer = new ScorePlayer;
        this.#activeVoice = 0;

        this.#noteEditor = new NoteEditor(this, this.scoreData);
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

    set instrumentForActiveVoice(instrumentName : string) {
        this.#scorePlayer.setInstrument(this.activeVoice, new Instrument(instrumentName));
    }

    get activeVoiceData() {
        return this.#scoreData.noteData[this.activeVoice];
    }

    endInteraction() {
        this.#noteEditor.endInteraction();
    }

    mouseEnterColumn(columnIndex: number) {
        this.#noteEditor.mouseEnterColumn(columnIndex);
    }

    setUIUpdateCallback(columnIndex: number, noteIndex: number, callback: () => void) {
        this.#noteEditor.setUIUpdateCallback(columnIndex, noteIndex, callback);
    }
}