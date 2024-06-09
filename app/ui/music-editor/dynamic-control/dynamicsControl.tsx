import React, {RefObject, useContext, useEffect, useRef} from "react";

import './dynamics.css';

import {ScoreEditorContext} from "@/app/ui/music-editor/musicEditor";
import {ScoreEditor} from "@/app/logic/scoreEditor";
import {createArray, useManualRerender} from "@/app/lib/util";
import {RenderWhenVisible} from "@/app/ui/renderWhenVisible";
import {ScrollPane, ScrollSyncContext} from "@/app/lib/scrollSync";
import {DynamicsValue} from "@/app/logic/voiceData";

const dynamics_characters = {
    p: '\ue520',
    m: '\ue521',
    f: '\ue522',
    n: '\ue526',
};

function CrescendoMarking({size}: {size: number}) {
    let w = size * 14;
    const h = 14;
    return <svg width={`${w}`} height={`${h}`} viewBox={`0 0 ${w} ${h}`}>
        <path d={`M 3 1 L ${w - 3} ${h / 2} 3 ${h - 1}`} fill="none" stroke="currentcolor" strokeLinejoin="bevel"/>
    </svg>
}

function DecrescendoMarking({size}: {size: number}) {
    let w = size * 14;
    const h = 14;
    return <svg width={`${w}`} height={`${h}`} viewBox={`0 0 ${w} ${h}`}>
        <path d={`M ${w - 3} 1 L 3 ${h / 2} ${w - 3} ${h - 1}`} fill="none" stroke="currentcolor" strokeLinejoin="bevel"/>
    </svg>
}

function DynamicsColumn({columnIndex}: { columnIndex: number }) {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;

    const rerender = useManualRerender();

    const columnRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if(columnRef.current) {
            columnRef.current.onclick = _ => {
                if(editor.activeVoiceData.getDynamicValue(columnIndex - 1) !== DynamicsValue.None || editor.activeVoiceData.getDynamicValue(columnIndex + 1) !== DynamicsValue.None) {
                    return;
                }

            }
        }
    });


    return <div className="dynamics-column" ref={columnRef}>
        {
            (<span className={`dynamics-marking dynamics-value voice-${
                (columnIndex * 1133) % 209 % 6 + 1
            }`}>{dynamics_characters.m}{dynamics_characters.f}</span>)
        }
        {
            (<span className={`dynamics-marking dynamics-crescendo voice-${
                (columnIndex * 2123) % 229 % 6 + 1
            }`}>
                <DecrescendoMarking size={5}/>
            </span>)
        }
    </div>;
}

export function DynamicsControl() {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;
    const scrollSyncer = useContext(ScrollSyncContext);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current === null) return;

        const pane = new ScrollPane(containerRef.current);
        scrollSyncer.registerPane(pane);

        return () => {
            scrollSyncer.unregisterPane(pane);
        }
    });

    return <>
        <div id="dynamic-control" ref={containerRef}>
            <div id="dynamic-control-left">
            </div>
            <div id="dynamic-control-content">
                {
                    createArray(editor.scoreData.length, i =>
                        <RenderWhenVisible key={i} placeholderSupplier={(ref: RefObject<HTMLDivElement>) => (
                            <div ref={ref} className="dynamic-column-placeholder"></div>
                        )}>
                            <DynamicsColumn columnIndex={i}></DynamicsColumn>
                        </RenderWhenVisible>
                    )
                }
            </div>
        </div>
    </>;
}