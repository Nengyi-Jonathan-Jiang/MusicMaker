import {useManualRerender} from "@/app/lib/util";
import {instrumentData} from "@/public/audio/allInstruments";
import {AsyncTask} from "@/app/lib/asyncTask";
import React, {useContext} from "react";
import {ScoreEditorContext} from "@/app/ui/music-editor/musicEditor";
import {ScoreEditor} from "@/app/logic/scoreEditor";

import './controls.css'
import {Select} from "@/app/lib/select";

export function InstrumentSelector() {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;

    const rerender = useManualRerender();

    const activeInstrument = editor.instrumentForActiveVoice;

    const isActiveInstrumentLoaded = activeInstrument.isSamplerLoaded;
    if (!isActiveInstrumentLoaded) activeInstrument.onSamplerLoad(rerender);
    // {[...instrumentData.keys()].map(instrumentName => {
    //
    //     const task = instrumentData.get(instrumentName) as AsyncTask<any>;
    //     if (!task.isFinished) task.onFinished(rerender);
    //
    //     return (
    //         <option value={instrumentName}
    //                 key={`instrument-select-${instrumentName}`}
    //                 data-loaded={task.isFinished ? "" : (task.onFinished(rerender), null)}>{instrumentName}</option>
    //     );
    // })}
    return <>
        <span>Instrument:</span>
        <Select id="instrument-select" onChange={(value) => {
            editor.instrumentForActiveVoice = value;
            rerender();
        }} value={activeInstrument.name} data-loaded={isActiveInstrumentLoaded ? "" : null}
                options={[...instrumentData.keys()]}
                activeOptionProps={(instrumentName) => {
                    const task = instrumentData.get(instrumentName) as AsyncTask<any>;
                    if (!task.isFinished) task.onFinished(rerender);

                    return ({
                        className: "instrument-select-active-option",
                        "data-loaded": (task.isFinished ? "" : (task.onFinished(rerender), null))
                    });
                }}
                optionProps={() => ({
                    className: "instrument-select-option"
                })}/>
    </>;
}