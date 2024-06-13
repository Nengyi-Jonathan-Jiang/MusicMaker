import {Instrument} from "@/app/logic/instrument";
import {createArray} from "@/app/lib/util";
import {getTransport, now} from "tone";
import * as Constants from "@/app/logic/Constants";
import {ScoreData} from "@/app/logic/scoreData";
import {LinearValueConvertor, ValueConvertor} from "@/app/lib/valueConvertor";
import {MaximumNumberFinder} from "@/app/lib/minMax";
import {IScrollSyncer, ScrollableElement, ScrollPane} from "@/app/lib/scrollSync";
import {NUM_NOTES, NUM_VOICES} from "@/app/logic/Constants";

const columnsToScrollAmountConvertor = new LinearValueConvertor(14, 19);

class DummyScrollElement implements ScrollableElement {
    readonly clientHeight: 0 = 0;
    clientWidth: 0 = 0;
    onscroll: (() => any) | null = null;
    scrollHeight: 0 = 0;
    #scrollLeft : number;
    scrollTop: 0 = 0;
    scrollWidth: number;

    constructor(score: ScoreData) {
        this.#scrollLeft = 0;
        this.scrollWidth = columnsToScrollAmountConvertor.convertForwards(score.length);
    }

    get scrollLeft() {
        return this.#scrollLeft;
    }

    set scrollLeft(amount) {
        this.#scrollLeft = amount;
    }

    setScroll(amount: number) {
        this.scrollLeft = amount;
        this.onscroll?.();
    }
}

export class ScorePlayer {
    instruments: Instrument[];

    #isPlaying;
    #currTimeout;

    constructor() {
        this.instruments = createArray(Constants.NUM_VOICES, () => new Instrument)

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
        if(!this.isPlaying) return;

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

    playAll(score: ScoreData, syncer: IScrollSyncer) {
        this.stopPlaying();

        getTransport().position = 0;
        getTransport().start();
        this.#isPlaying = true;

        const dummyScrollPane = new ScrollPane(new DummyScrollElement(score));
        syncer.registerPane(dummyScrollPane);

        const currentColumn = columnsToScrollAmountConvertor.convertBackwards(dummyScrollPane.scrollAmountX);

        const columnsToSecondsConvertor = new LinearValueConvertor(60 / score.bpm / 6, -currentColumn, true);
        const timeToScrollAmountConvertor = ValueConvertor.compose(ValueConvertor.invert(columnsToSecondsConvertor), columnsToScrollAmountConvertor);

        const playDurationFinder = new MaximumNumberFinder(0);

        for (let voice = 0; voice < NUM_VOICES; voice++) {
            const instrument = this.instruments[voice];

            const initialNotes = new Set<number>;

            for (let column = 0; column < score.length; column++) {
                for (let noteIndex = 0; noteIndex < NUM_NOTES; noteIndex++) {
                    const command = score.voiceData[voice].getNoteCommand(column, noteIndex);

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
            dummyScrollPane.element.setScroll(timeToScrollAmountConvertor.convertForwards(playDuration));
            syncer.unregisterPane(dummyScrollPane);
        }, playDuration * 1000);

        const startTime = now();

        const frame = () => {
            let elapsedTimeSeconds = now() - startTime;

            dummyScrollPane.element.setScroll(timeToScrollAmountConvertor.convertForwards(elapsedTimeSeconds));

            if (elapsedTimeSeconds > playDurationFinder.get()) {
                dummyScrollPane.element.setScroll(timeToScrollAmountConvertor.convertForwards(playDuration));
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