import {Sampler, SamplerOptions, ToneAudioBuffer} from "tone";
import {AsyncTask} from "@/app/lib/asyncTask";

const instrumentsStr = `
Piano :
    audio/piano/A0.mp3
    audio/piano/A1.mp3
    audio/piano/A2.mp3
    audio/piano/A3.mp3
    audio/piano/A4.mp3
    audio/piano/A5.mp3
    audio/piano/A6.mp3
    audio/piano/A7.mp3
    audio/piano/C1.mp3
    audio/piano/C2.mp3
    audio/piano/C3.mp3
    audio/piano/C4.mp3
    audio/piano/C5.mp3
    audio/piano/C6.mp3
    audio/piano/C7.mp3
    audio/piano/C8.mp3
    audio/piano/Ds1.mp3
    audio/piano/Ds2.mp3
    audio/piano/Ds3.mp3
    audio/piano/Ds4.mp3
    audio/piano/Ds5.mp3
    audio/piano/Ds6.mp3
    audio/piano/Ds7.mp3
    audio/piano/Fs1.mp3
    audio/piano/Fs2.mp3
    audio/piano/Fs3.mp3
    audio/piano/Fs4.mp3
    audio/piano/Fs5.mp3
    audio/piano/Fs6.mp3
    audio/piano/Fs7.mp3
;
Guitar :
    audio/guitar/B3.wav
    audio/guitar/C3.wav
    audio/guitar/C5.wav
    audio/guitar/E2.wav
    audio/guitar/F#3.wav
    audio/guitar/F#5.wav
    audio/guitar/F4.wav
    audio/guitar/G2.wav
;

Violin : 
    audio/violin/violin-a#3-L.wav
    audio/violin/violin-a#4-L.wav
    audio/violin/violin-a#5-L.wav
    audio/violin/violin-a#6-L.wav
    audio/violin/violin-c#4-L.wav
    audio/violin/violin-c#5-L.wav
    audio/violin/violin-c#6-L.wav
    audio/violin/violin-e4-L.wav
    audio/violin/violin-e5-L.wav
    audio/violin/violin-e6-L.wav
    audio/violin/violin-g3-L.wav
    audio/violin/violin-g4-L.wav
    audio/violin/violin-g5-L.wav
    audio/violin/violin-g6-L.wav
;
Violas : 
    audio/violas/violas-sus-a3-L.wav
    audio/violas/violas-sus-a4-L.wav
    audio/violas/violas-sus-a5-L.wav
    audio/violas/violas-sus-c3-L.wav
    audio/violas/violas-sus-c4-L.wav
    audio/violas/violas-sus-c5-L.wav
    audio/violas/violas-sus-c6-L.wav
    audio/violas/violas-sus-d#3-L.wav
    audio/violas/violas-sus-d#4-L.wav
    audio/violas/violas-sus-d#5-L.wav
    audio/violas/violas-sus-f#3-L.wav
    audio/violas/violas-sus-f#4-L.wav
    audio/violas/violas-sus-f#5-L.wav
;
Cello : 
    audio/cello/Cello-A5.wav
    audio/cello/Cello-B4.wav
    audio/cello/Cello-C3.wav
    audio/cello/Cello-C4.wav
    audio/cello/Cello-D2.wav
    audio/cello/Cello-D3.wav
    audio/cello/Cello-E5.wav
    audio/cello/Cello-F4.wav
    audio/cello/Cello-G2.wav
    audio/cello/Cello-G3.wav
;
Double Basses :
    audio/double_basses/basses-sus-a1-R.wav
    audio/double_basses/basses-sus-a2-R.wav
    audio/double_basses/basses-sus-a3-R.wav
    audio/double_basses/basses-sus-c1-R.wav
    audio/double_basses/basses-sus-c2-R.wav
    audio/double_basses/basses-sus-c3-R.wav
    audio/double_basses/basses-sus-c4-R.wav
    audio/double_basses/basses-sus-d#1-R.wav
    audio/double_basses/basses-sus-d#2-R.wav
    audio/double_basses/basses-sus-d#3-R.wav
    audio/double_basses/basses-sus-f#1-R.wav
    audio/double_basses/basses-sus-f#2-R.wav
    audio/double_basses/basses-sus-f#3-R.wav
;

Flute :
    audio/flute/Flute-A#4.wav
    audio/flute/Flute-A#5.wav
    audio/flute/Flute-A#6.wav
    audio/flute/Flute-C#4.wav
    audio/flute/Flute-C#5.wav
    audio/flute/Flute-C#6.wav
    audio/flute/Flute-D#4.wav
    audio/flute/Flute-E5.wav
    audio/flute/Flute-E6.wav
    audio/flute/Flute-G4.wav
    audio/flute/Flute-G5.wav
    audio/flute/Flute-G6.wav
;
Oboe :
	audio/oboe/Oboe-A#3.wav
	audio/oboe/Oboe-A4.wav
	audio/oboe/Oboe-C#3.wav
	audio/oboe/Oboe-C5.wav
	audio/oboe/Oboe-E4.wav
	audio/oboe/Oboe-F#3.wav
;
Clarinet :
	audio/clarinet/Cl_050.wav
	audio/clarinet/Cl_052.wav
	audio/clarinet/Cl_054.wav
	audio/clarinet/Cl_055.wav
	audio/clarinet/Cl_056.wav
	audio/clarinet/Cl_059.wav
	audio/clarinet/Cl_063.wav
	audio/clarinet/Cl_065.wav
	audio/clarinet/Cl_067.wav
	audio/clarinet/Cl_068.wav
	audio/clarinet/Cl_076.wav
	audio/clarinet/Cl_077.wav
	audio/clarinet/Cl_082.wav
	audio/clarinet/Cl_084.wav
;   
Bassoon :
    audio/bassoon/Bassoon-A#3.wav
    audio/bassoon/Bassoon-B4.wav
    audio/bassoon/Bassoon-C2.wav
    audio/bassoon/Bassoon-C3.wav
    audio/bassoon/Bassoon-C4.wav
    audio/bassoon/Bassoon-C5.wav
    audio/bassoon/Bassoon-D2.wav
    audio/bassoon/Bassoon-D3.wav
    audio/bassoon/Bassoon-D4.wav
    audio/bassoon/Bassoon-D5.wav
    audio/bassoon/Bassoon-E2.wav
    audio/bassoon/Bassoon-E3.wav
    audio/bassoon/Bassoon-F#4.wav
    audio/bassoon/Bassoon-G#4.wav
;

Trumpet :
    audio/trumpet/Trumpet-A#3.wav
    audio/trumpet/Trumpet-A4.wav
    audio/trumpet/Trumpet-B5.wav
    audio/trumpet/Trumpet-D5.wav
    audio/trumpet/Trumpet-E4.wav
    audio/trumpet/Trumpet-F#6.wav
    audio/trumpet/Trumpet-G5.wav
;
Trombone :
    audio/trombone/Trombone-A2.wav
    audio/trombone/Trombone-B1.wav
    audio/trombone/Trombone-C#1.wav
    audio/trombone/Trombone-C4.wav
    audio/trombone/Trombone-D3.wav
    audio/trombone/Trombone-E2.wav
    audio/trombone/Trombone-G3.wav
;
Tuba :
    audio/tuba/Tuba-A#1.wav
    audio/tuba/Tuba-D1.wav
    audio/tuba/Tuba-F#0.wav
    audio/tuba/Tuba-F#1.wav
`;

function getNoteName(path : string) : string | number {
    const noteNameMatch = path.match(/[A-Ga-g][s#]?\d|\d\d\d/) as RegExpMatchArray;
    const str = noteNameMatch[0].toUpperCase().replaceAll(/[sS]/g, '#');
    return isNaN(+str) ? str : +str;
}

/**
 * Copied from the internal type definitions of Tone.js. I'm not sure why this is not exposed.
 *
 * Used in {@link SamplerOptions}, which is in turn used in {@link Sampler.constructor}
 */
type SamplesMap = {
    [p : string] : ToneAudioBuffer | AudioBuffer | string
};

export const instrumentData: Map<string, AsyncTask<Partial<SamplerOptions>>> = new Map(
    instrumentsStr.trim().split(/\s*;\s*/g)
        .map(i => i.split(/\s*:\s*/g))
        .map(([instrumentName, instrumentSourcesStr]) => ({
            instrumentName,
            paths: instrumentSourcesStr.split(/\s*\n\s*/g)
        }))
        .map(({instrumentName, paths}) => [
        instrumentName,
        new AsyncTask(async () => ({
            urls: (await Promise.all(
                paths.map(async path => Object.fromEntries(
                    [[getNoteName(path), await new ToneAudioBuffer().load(path)]]
                ))
            )).reduce((a: SamplesMap, b) : SamplesMap => ({...a, ...b}), {})
        }), true)
    ])
);