import * as Tone from "tone";
import {Sampler, SamplerOptions} from "tone";
import {instrumentData} from "@/public/audio/allInstruments";

import {AsyncTask} from "@/app/lib/asyncTask";

export class Instrument {
    static get DEFAULT_TYPE () { return 'Piano' }

    name: string;
    sampler: Sampler | null;
    #samplerData: AsyncTask<Partial<SamplerOptions>>;

    constructor(instrumentType: string = Instrument.DEFAULT_TYPE) {
        this.name = instrumentType;
        const samplerDataFetch = instrumentData.get(instrumentType);
        if(samplerDataFetch === undefined) {
            throw new Error(`Unknown instrument ${instrumentType}`);
        }
        // If the sampler data has not begun fetching yet, start fetching the data
        samplerDataFetch.start();

        this.sampler = null;
        (this.#samplerData = samplerDataFetch).onFinished((options) => {
            this.sampler = new Sampler({...options, release: 1}).toDestination();
            this.sampler.sync();
        });
    }

    /**
     * Calls the given function when the sampler loads if it has not already loaded
     */
    onSamplerLoad(func : () => any) {
        if(this.isSamplerLoaded) return;
        this.#samplerData.onFinished(func);
    }

    get isSamplerLoaded() : boolean {
        return this.sampler !== null;
    }

    start(note: number, time: number) {
        this.sampler?.triggerAttack?.(note, time, 0.3);
    }

    stop(note: number, time: number) {
        this.sampler?.triggerRelease?.(note, time);
    }

    stopAll() {
        this.sampler?.releaseAll?.();
    }
}

async function tryStartAudioContext() {
    if(Tone.getContext().state !== 'running') {
        await Tone.start();
        console.log('Started web audio context');
    }
}

window.addEventListener("keydown", tryStartAudioContext);
window.addEventListener("mousedown", tryStartAudioContext);