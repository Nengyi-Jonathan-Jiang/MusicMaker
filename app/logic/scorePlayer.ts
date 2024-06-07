import {Instrument} from "@/app/logic/instrument";
import {createArray, getCurrTimeSeconds} from "@/app/lib/util";
import {getTransport} from "tone";
import * as Constants from "@/app/logic/Constants";
import {ScoreData} from "@/app/logic/scoreData";

const NOTE_WIDTH = 14;
const NOTES_LEFT_MARGIN = 8;

export class ScorePlayer {
    instruments: Instrument[];

    #isPlaying;
    #currTimeout;

    constructor() {
        this.instruments = createArray(Constants.NUM_VOICES, () => new Instrument('Piano'))

        this.#isPlaying = false;

        this.#currTimeout = setTimeout(() => {}, 0);
    }

    static _getFrequency(noteIndex: number) {
        return ~~(Math.pow(2, (39 - noteIndex) / 12) * 440);
    }

    setInstrument(voice: number, instrument: Instrument) {
        this.stopPlaying();
        this.instruments[voice] = instrument;
    }

    getInstrument(voice: number) {
        return this.instruments[voice];
    }

    stopPlaying() {
        this.instruments.forEach(i => {
            i.stopAll();
        });

        getTransport().cancel();
        getTransport().stop();
        getTransport().position = 0;
        getTransport().cancel();

        this.#isPlaying = false;
        clearTimeout(this.#currTimeout);
    }

    playAll(score: ScoreData, el: HTMLDivElement) {
        this.stopPlaying();

        getTransport().position = 0;
        getTransport().start();
        this.#isPlaying = true;

        const columnOffset = (el.scrollLeft - NOTES_LEFT_MARGIN) / NOTE_WIDTH;
        let playDuration = 0;

        let timeFactor = 60 / score.bpm / 6;
        for (let voice = 0; voice < ScoreData.NUM_VOICES; voice++) {
            const instrument = this.instruments[voice];

            const initialNotes = new Set<number>;

            for (let column = 0; column < score.length; column++) {
                for (let noteIndex = 0; noteIndex < ScoreData.NUM_NOTES; noteIndex++) {
                    const command = score.noteData[voice].getCommand(column, noteIndex);

                    const col = column - columnOffset;

                    if (col < 0) {
                        if (command.doBegin) {
                            initialNotes.add(noteIndex);
                        }
                        if (command.doEnd) {
                            initialNotes.delete(noteIndex);
                        }
                        continue;
                    }

                    if (command.doBegin) {
                        instrument.start(ScorePlayer._getFrequency(noteIndex), col * timeFactor);
                    }
                    if (command.doEnd) {
                        instrument.stop(ScorePlayer._getFrequency(noteIndex), (col + .999) * timeFactor);
                        playDuration = Math.max(playDuration, (col + .999) * timeFactor);
                    }
                }
            }

            for (const noteIndex of initialNotes) {
                instrument.start(ScorePlayer._getFrequency(noteIndex), 0);
            }
        }

        const currTimeout = this.#currTimeout = setTimeout(() => {
            this.stopPlaying();
        }, playDuration * 1000);

        const startTime = getCurrTimeSeconds();

        const frame = () => {
            let elapsedTimeSeconds = getCurrTimeSeconds() - startTime;

            el.scrollLeft = (elapsedTimeSeconds / timeFactor + columnOffset) * NOTE_WIDTH + NOTES_LEFT_MARGIN;

            if (elapsedTimeSeconds > playDuration) {
                el.scrollLeft = (playDuration / timeFactor + columnOffset) * NOTE_WIDTH + NOTES_LEFT_MARGIN;
            }

            if (this.#isPlaying && this.#currTimeout === currTimeout) {
                requestAnimationFrame(frame);
            }
        }

        requestAnimationFrame(frame);
    }

    get isPlaying() {
        return this.#isPlaying;
    }
}