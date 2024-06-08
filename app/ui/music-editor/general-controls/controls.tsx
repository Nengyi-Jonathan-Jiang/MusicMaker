import {ScoreEditor} from "@/app/logic/scoreEditor";
import React, {useContext, useEffect, useState} from "react";
import {createArray, useManualRerender} from "@/app/lib/util";
import {ScoreData} from "@/app/logic/scoreData";

import './controls.css';
import {ScoreEditorContext} from "@/app/ui/music-editor/musicEditor";
import {InstrumentSelector} from "@/app/ui/music-editor/general-controls/instrumentSelector";

export function Controls() {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;

    const [activeVoice, setActiveVoice] = useState(0);
    const [activeSnappingOption, setActiveSnappingOption] = useState(0);
    const [timeSignature, setTimeSignature] = useState(0);
    const [pickupBeats, setPickupBeats] = useState(0);

    const rerender = useManualRerender();

    const snapping_options: { interval: number; display: string; }[] = [
        {interval: 1, display: 'None'},
        {interval: 6, display: 'Beat'},
        {interval: 3, display: '½ Beat'},
        {interval: 2, display: '⅓ Beat'},
    ];

    const tSigOpts = {
        numerator: [
            4, 3, 2, 12, 9, 6
        ],
        denominator: [
            4, 4, 4, 8, 8, 8
        ]
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.ctrlKey && '0123'.includes(e.key)) {
            setActiveSnappingOption(+e.key);
            editor.useSnappingInterval(snapping_options[+e.key].interval);
            e.preventDefault();
        } else if ('123456'.includes(e.key)) {
            setActiveVoice(editor.activeVoice = +e.key - 1);
        }
    }

    useEffect(() => {
        /** @param {KeyboardEvent} e */
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        }
    });

    return (
        // We don't actually care about the denominator of the time signature
        <div id="controls" data-time-signature={`${tSigOpts.numerator[timeSignature]}+${pickupBeats}`}>
            <span className="controls-section">
                <span>Voice:</span>
                 <span className="multi-select" id="voice-selector">
                    {
                        createArray(ScoreData.NUM_VOICES, i => (
                            <span key={`voice-select-${i + 1}`} onClick={() => {
                                setActiveVoice(editor.activeVoice = i);
                            }} data-active={i === activeVoice ? "" : null}>{i + 1}</span>
                        ))
                    }
                </span>
            </span>

            <span className="controls-section">
                <InstrumentSelector/>
            </span>

            <span className="controls-section">
                <span>Time signature:</span>
                <span id="time-signature" onClick={() => setTimeSignature((timeSignature + 1) % 6)}>
                    <span id="beats-per-measure">{tSigOpts.numerator[timeSignature]}</span>
                    <span id="note-for-beat">{tSigOpts.denominator[timeSignature]}</span>
                </span>
            </span>

            <span className="controls-section">
                <span onClick={() => setPickupBeats((pickupBeats + 1) % 3)}>{pickupBeats} beat pickup</span>
            </span>


            <span className="controls-section">
                <span>Snap to:</span>
                <span className="multi-select" id="snap-selector">
                    {
                        snapping_options.map(({display, interval}, i) => (
                            <span key={`snapping-option-${i + 1}`} onClick={() => {
                                setActiveSnappingOption(i);
                                editor.useSnappingInterval(interval);
                            }} data-active={i === activeSnappingOption ? "" : null}>{display}</span>
                        ))
                    }
                </span>
            </span>

            <span id="controls-section-middle" className="controls-section"></span>

            <span className="controls-section">
                <label><input type="number" id="bpm" className="no-wheel" value={editor.scoreData.bpm}
                              onChange={(e) => {
                                  editor.scoreData.bpm = +e.target.value;
                                  rerender();
                              }}/>BPM</label>
            </span>
        </div>
    )
}