import * as Tone from "tone";
import {Sampler, SamplerOptions} from "tone";
import {instrumentData, instruments} from "@/public/audio/instruments";
import {AsyncTask} from "@/app/lib/util";

export class Instrument {
    name: string;
    sampler: Sampler | null;
    #samplerData: AsyncTask<Partial<SamplerOptions>>;

    constructor(name: string) {
        this.name = name;
        const samplerData = instrumentData.get(name);
        if(samplerData === undefined) {
            throw new Error(`Unknown instrument ${name}`);
        }

        this.sampler = null;
        (this.#samplerData = samplerData).onFinished((options) => {
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