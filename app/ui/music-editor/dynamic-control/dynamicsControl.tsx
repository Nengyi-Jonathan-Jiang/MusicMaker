import React, {MutableRefObject, RefObject, useContext, useEffect, useRef, useState} from "react";

import './dynamics.css';

import {ContinuousDynamicsEditorContext, ScoreEditorContext} from "@/app/ui/music-editor/musicEditor";
import {ScoreEditor} from "@/app/logic/editor/scoreEditor";
import {createArray, useListenerOnHTMLElement, useListenerOnWindow, useManualRerender} from "@/app/lib/utils/util";
import {RenderWhenVisible} from "@/app/ui/renderWhenVisible";
import {ScrollPane, ScrollSyncContext} from "@/app/lib/react-utils/scrollSync";
import {ContinuousDynamicsCommand, PointDynamicsValue} from "@/app/logic/voiceData";
import {ContinuousDynamicsEditor} from "@/app/logic/editor/continuousDynamicsEditor";

const dynamics_characters = {
    p: '\ue520',
    m: '\ue521',
    f: '\ue522',
    n: '\ue526',
};

type DynamicsOption = PointDynamicsValue | ContinuousDynamicsCommand;

function getDynamicsText(value: PointDynamicsValue) {
    return [...value].map(i => dynamics_characters[i as 'p' | 'm' | 'f' | 'n']).join('');
}

function CrescendoMarking({size}: { size: number }) {
    let w = size * 14;
    const h = 14;
    return <svg width={`${w}`} height={`${h}`} viewBox={`0 0 ${w} ${h}`}>
        <path d={`M ${w - 3} 1 L 3 ${h / 2} ${w - 3} ${h - 1}`} fill="none" stroke="currentcolor"
              strokeLinejoin="bevel"/>
    </svg>
}

function DiminuendoMarking({size}: { size: number }) {
    let w = size * 14;
    const h = 14;
    return <svg width={`${w}`} height={`${h}`} viewBox={`0 0 ${w} ${h}`}>
        <path d={`M 3 1 L ${w - 3} ${h / 2} 3 ${h - 1}`} fill="none" stroke="currentcolor" strokeLinejoin="bevel"/>
    </svg>
}

function DynamicsColumn({columnIndex, currDynamicOptionRef}: {
    columnIndex: number,
    currDynamicOptionRef: React.MutableRefObject<DynamicsOption | null>
}) {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;
    const dEditor = useContext(ContinuousDynamicsEditorContext) as ContinuousDynamicsEditor;

    const rerender = useManualRerender();
    dEditor.setUIUpdateCallback(columnIndex, rerender);

    const columnRef = useRef<HTMLDivElement>(null);

    function onInteractionEnd() {
        dEditor.endInteraction();
    }

    useListenerOnHTMLElement(columnRef, 'mousedown', e => {
        if (!currDynamicOptionRef.current) return;

        if(e.button === 0) {
            switch (currDynamicOptionRef.current) {
                case PointDynamicsValue.ff: case PointDynamicsValue.f: case PointDynamicsValue.mf:
                case PointDynamicsValue.mp: case PointDynamicsValue.p: case PointDynamicsValue.pp:
                case PointDynamicsValue.n:
                    if (editor.activeVoiceData.getPointDynamics(columnIndex - 1) || editor.activeVoiceData.getPointDynamics(columnIndex + 1)) {
                        return;
                    }
                    editor.activeVoiceData.setPointDynamics(columnIndex, currDynamicOptionRef.current);
                    rerender();
                    break;
                case ContinuousDynamicsCommand.Crescendo:
                case ContinuousDynamicsCommand.Diminuendo:
                    dEditor.startInteraction(columnIndex, currDynamicOptionRef.current);
            }
        }
        else if(e.button === 2) {
            switch (currDynamicOptionRef.current) {
                case PointDynamicsValue.ff: case PointDynamicsValue.f: case PointDynamicsValue.mf:
                case PointDynamicsValue.mp: case PointDynamicsValue.p: case PointDynamicsValue.pp:
                case PointDynamicsValue.n:
                    editor.activeVoiceData.setPointDynamics(columnIndex, PointDynamicsValue.None);
                    rerender();
                    break;
                case ContinuousDynamicsCommand.Crescendo:
                case ContinuousDynamicsCommand.Diminuendo:
                    dEditor.startInteraction(columnIndex, ContinuousDynamicsCommand.None);
            }
        }
    });

    useListenerOnHTMLElement(columnRef, 'contextmenu', e => e.preventDefault());
    useListenerOnHTMLElement(columnRef, 'mouseenter', () => dEditor.mouseEnterColumn(columnIndex));

    useListenerOnWindow(window, 'mouseup', onInteractionEnd);
    useListenerOnWindow(window, 'blur', onInteractionEnd);
    useListenerOnWindow(window, 'mouseleave', onInteractionEnd);

    return <div className="dynamics-column" ref={columnRef}>
        {
            editor.scoreData.voiceData.map((voiceData, i) => {
                const val = voiceData.getPointDynamics(columnIndex);
                return val !== PointDynamicsValue.None ? (
                    <span className={`dynamics-marking dynamics-value voice-${i + 1} dynamic-${val}`} key={i}>
                        {getDynamicsText(val)}
                    </span>
                ) : null;
            })
        }
        {
            editor.scoreData.voiceData.map((voiceData, voice) => {
                const val = voiceData.getContinuousDynamics(columnIndex);

                const hairpinInterval = dEditor.getHairpinInterval(voice, columnIndex);
                if(hairpinInterval && hairpinInterval.start === columnIndex) {

                    const Marking = val === ContinuousDynamicsCommand.Crescendo ? CrescendoMarking : DiminuendoMarking;

                    return <span className={`dynamics-marking dynamics-crescendo voice-${voice + 1}`} key={voice}>
                        <Marking size={hairpinInterval.length}/>
                    </span>
                }
                return null;

            })
        }
    </div>;
}

export function DynamicOptionSelector({currDynamicOptionRef}: {
    currDynamicOptionRef: MutableRefObject<DynamicsOption | null>
}) {
    const [currDynamicOption, setCurrDynamicOption] = useState<DynamicsOption | null>(null);

    function onClickOption(value: DynamicsOption) {
        if (currDynamicOptionRef.current === value) {
            setCurrDynamicOption(currDynamicOptionRef.current = null);
        } else {
            setCurrDynamicOption(currDynamicOptionRef.current = value);
        }
    }

    return <div id="dynamic-options">
        {
            [
                PointDynamicsValue.pp, PointDynamicsValue.p, PointDynamicsValue.mp,
                PointDynamicsValue.mf, PointDynamicsValue.f, PointDynamicsValue.ff,
                PointDynamicsValue.n,
            ].map((value) => {
                return <span className="dynamic-option" key={value}
                             data-active={value === currDynamicOption ? '' : null}
                             onClick={() => onClickOption(value)}>{getDynamicsText(value)}</span>;
            })
        }
        {
            [
                ContinuousDynamicsCommand.Crescendo, ContinuousDynamicsCommand.Diminuendo,
            ].map((value) => {
                return <span className="dynamic-option" key={value}
                             data-active={value === currDynamicOption ? '' : null}
                             onClick={() => onClickOption(value)}>{value}</span>;
            })
        }
    </div>
}

export function DynamicsControl() {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;
    const scrollSyncer = useContext(ScrollSyncContext);
    const containerRef = useRef<HTMLDivElement>(null);
    const currDynamicOptionRef = useRef<DynamicsOption | null>(null);

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
                <DynamicOptionSelector currDynamicOptionRef={currDynamicOptionRef}/>
            </div>
            <div id="dynamic-control-content">
                {
                    createArray(editor.scoreData.length, i =>
                        <RenderWhenVisible key={i} placeholderSupplier={(ref: RefObject<HTMLDivElement>) => (
                            <div ref={ref} className="dynamic-column-placeholder"></div>
                        )}>
                            <DynamicsColumn columnIndex={i}
                                            currDynamicOptionRef={currDynamicOptionRef}></DynamicsColumn>
                        </RenderWhenVisible>
                    )
                }
            </div>
        </div>
    </>;
}