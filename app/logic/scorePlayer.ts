import {Instrument} from "@/app/logic/instrument";
import {createArray, getCurrTimeSeconds} from "@/app/lib/util";
import {getTransport} from "tone";
import * as Constants from "@/app/logic/Constants";
import {ScoreData} from "@/app/logic/scoreData";
import {LinearValueConvertor, ValueConvertor} from "@/app/lib/valueConvertor";
import {MaximumNumberFinder} from "@/app/lib/minMax";

const NOTE_WIDTH = 14;
const NOTES_LEFT_MARGIN = 8;

const columnsToScrollAmountConvertor = new LinearValueConvertor(14, 8);
const columnsToBeatsConvertor = new LinearValueConvertor(1 / 6);

export class ScorePlayer {
    instruments: Instrument[];

    #isPlaying;
    #currTimeout;

    constructor() {
        this.instruments = createArray(Constants.NUM_VOICES, () => new Instrument())

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

        const currentColumn = columnsToScrollAmountConvertor.convertBackwards(el.scrollLeft);

        const columnsToSecondsConvertor = new LinearValueConvertor(60 / score.bpm / 6, -currentColumn, true);
        const timeToScrollAmountConvertor = ValueConvertor.compose(ValueConvertor.invert(columnsToSecondsConvertor), columnsToScrollAmountConvertor);

        const playDurationFinder = new MaximumNumberFinder(0);

        for (let voice = 0; voice < ScoreData.NUM_VOICES; voice++) {
            const instrument = this.instruments[voice];

            const initialNotes = new Set<number>;

            for (let column = 0; column < score.length; column++) {
                for (let noteIndex = 0; noteIndex < ScoreData.NUM_NOTES; noteIndex++) {
                    const command = score.noteData[voice].getCommand(column, noteIndex);

                    if (column < currentColumn) {
                        if (command.doBegin) {
                            initialNotes.add(noteIndex);
                        }
                        if (command.doEnd) {
                            initialNotes.delete(noteIndex);
                        }
                        continue;
                    }

                    if (command.doBegin) {
                        instrument.start(ScorePlayer._getFrequency(noteIndex), columnsToSecondsConvertor.convertForwards(column));
                    }
                    if (command.doEnd) {
                        let endTime = columnsToSecondsConvertor.convertForwards(column + .999);
                        instrument.stop(ScorePlayer._getFrequency(noteIndex), endTime);
                        playDurationFinder.accept(endTime);
                    }
                }
            }

            for (const noteIndex of initialNotes) {
                instrument.start(ScorePlayer._getFrequency(noteIndex), 0);
            }
        }

        const playDuration = playDurationFinder.get();

        const currTimeout = this.#currTimeout = setTimeout(() => {
            this.stopPlaying();
        }, playDuration * 1000);

        const startTime = getCurrTimeSeconds();

        const frame = () => {
            let elapsedTimeSeconds = getCurrTimeSeconds() - startTime;

            el.scrollLeft = timeToScrollAmountConvertor.convertForwards(elapsedTimeSeconds);

            if (elapsedTimeSeconds > playDurationFinder.get()) {
                el.scrollLeft = timeToScrollAmountConvertor.convertForwards(elapsedTimeSeconds);
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