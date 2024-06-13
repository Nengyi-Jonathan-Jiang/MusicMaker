import React, {MutableRefObject, RefObject, useContext, useEffect, useRef, useState} from "react";

import './dynamics.css';

import {ScoreEditorContext} from "@/app/ui/music-editor/musicEditor";
import {ScoreEditor} from "@/app/logic/editor/scoreEditor";
import {createArray, useManualRerender} from "@/app/lib/util";
import {RenderWhenVisible} from "@/app/ui/renderWhenVisible";
import {ScrollPane, ScrollSyncContext} from "@/app/lib/scrollSync";
import {DynamicsCommand, DynamicsValue} from "@/app/logic/voiceData";

const dynamics_characters = {
    p: '\ue520',
    m: '\ue521',
    f: '\ue522',
    n: '\ue526',
};

type DynamicsOption = DynamicsValue | DynamicsCommand;

function getDynamicsText(value: DynamicsValue) {
    return [...value].map(i => dynamics_characters[i as 'p' | 'm' | 'f' | 'n']).join('');
}

function CrescendoMarking({size}: { size: number }) {
    let w = size * 14;
    const h = 14;
    return <svg width={`${w}`} height={`${h}`} viewBox={`0 0 ${w} ${h}`}>
        <path d={`M 3 1 L ${w - 3} ${h / 2} 3 ${h - 1}`} fill="none" stroke="currentcolor" strokeLinejoin="bevel"/>
    </svg>
}

function DecrescendoMarking({size}: { size: number }) {
    let w = size * 14;
    const h = 14;
    return <svg width={`${w}`} height={`${h}`} viewBox={`0 0 ${w} ${h}`}>
        <path d={`M ${w - 3} 1 L 3 ${h / 2} ${w - 3} ${h - 1}`} fill="none" stroke="currentcolor"
              strokeLinejoin="bevel"/>
    </svg>
}

function DynamicsColumn({columnIndex, currDynamicOptionRef}: {
    columnIndex: number,
    currDynamicOptionRef: React.MutableRefObject<DynamicsOption | null>
}) {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;

    const rerender = useManualRerender();

    const columnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!columnRef.current) return;

        const el = columnRef.current;

        el.oncontextmenu = e => e.preventDefault();

        el.onmousedown = e => {
            if (!currDynamicOptionRef.current) return;

            if(e.button === 0) {
                switch (currDynamicOptionRef.current) {
                    case DynamicsValue.ff:
                    case DynamicsValue.f:
                    case DynamicsValue.mf:
                    case DynamicsValue.mp:
                    case DynamicsValue.p:
                    case DynamicsValue.pp:
                    case DynamicsValue.n:
                        if (editor.activeVoiceData.getDynamicValue(columnIndex - 1) || editor.activeVoiceData.getDynamicValue(columnIndex + 1)) {
                            return;
                        }
                        editor.activeVoiceData.setDynamicValue(columnIndex, currDynamicOptionRef.current);
                        rerender();
                        break;
                    case DynamicsCommand.Crescendo:
                    case DynamicsCommand.Decrescendo:
                        el.onmouseenter?.({buttons: 1} as MouseEvent);
                }
            }
            else if(e.button === 2) {
                switch (currDynamicOptionRef.current) {
                    case DynamicsValue.ff:
                    case DynamicsValue.f:
                    case DynamicsValue.mf:
                    case DynamicsValue.mp:
                    case DynamicsValue.p:
                    case DynamicsValue.pp:
                    case DynamicsValue.n:
                        editor.activeVoiceData.setDynamicValue(columnIndex, DynamicsValue.None);
                        rerender();
                        break;
                    case DynamicsCommand.Crescendo:
                    case DynamicsCommand.Decrescendo:
                        el.onmouseenter?.({buttons: 2} as MouseEvent);
                }
            }
        }

        el.onmouseenter = e => {
            if(e.buttons & 2) {
                editor.activeVoiceData.setDynamicCommand(columnIndex, DynamicsCommand.None);
                rerender();
            }
            else if((e.buttons & 1) && ([DynamicsCommand.Crescendo, DynamicsCommand.Decrescendo] as any[]).includes(currDynamicOptionRef.current)) {
                editor.activeVoiceData.setDynamicCommand(columnIndex, currDynamicOptionRef.current as DynamicsCommand);
                rerender();
            }
        }
    });

    return <div className="dynamics-column" ref={columnRef}>
        {
            editor.scoreData.voiceData.map((voiceData, i) => {
                const val = voiceData.getDynamicValue(columnIndex);
                return val ? (
                    <span className={`dynamics-marking dynamics-value voice-${i + 1} dynamic-${val}`} key={i}>
                        {getDynamicsText(val)}
                    </span>
                ) : null;
            })
        }
        {
            editor.scoreData.voiceData.map((voiceData, i) => {
                const val = voiceData.getDynamicCommand(columnIndex);
                if (!val || voiceData.getDynamicCommand(columnIndex - 1) === val) {
                    return null;
                } else {
                    // Figure out length of dynamics
                    let length = 0;
                    while (voiceData.getDynamicCommand(columnIndex + length) === val) length++;
                    return <span className={`dynamics-marking dynamics-crescendo voice-${i + 1}`} key={i}>
                        {
                            val === DynamicsCommand.Crescendo ? <CrescendoMarking size={length}/> : <DecrescendoMarking size={length}/>
                        }
                    </span>
                }
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
                DynamicsValue.pp, DynamicsValue.p, DynamicsValue.mp,
                DynamicsValue.mf, DynamicsValue.f, DynamicsValue.ff,
                DynamicsValue.n,
            ].map((value) => {
                return <span className="dynamic-option" key={value}
                             data-active={value === currDynamicOption ? '' : null}
                             onClick={() => onClickOption(value)}>{getDynamicsText(value)}</span>;
            })
        }
        {
            [
                DynamicsCommand.Crescendo, DynamicsCommand.Decrescendo,
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