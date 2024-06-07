import './note-editor.css'

import {ScoreEditor} from "@/app/logic/scoreEditor";
import React, {memo, RefObject, useContext, useEffect, useRef, useState} from "react";
import {arraysEqual, createArray, useListenerOnWindow} from "@/app/lib/util";
import {InstrumentCommand} from "@/app/logic/instrumentData";
import {ScoreEditorContext} from "@/app/ui/music-editor/musicEditor";
import {RenderWhenVisible} from "@/app/ui/renderWhenVisible";

export function NoteEditor() {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;

    const scoreData = editor.scoreData;

    const containerRef = useRef<HTMLDivElement>(null);

    function onInteractionEnd() {
        editor.endInteraction();
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === ' ') {
            if (editor.isPlaying) {
                editor.stopPlayScore();
            } else if (containerRef.current !== null) {
                editor.playScore(containerRef.current);
            }

            e.preventDefault();
            e.stopPropagation();
        }
        if (e.key === 'R' && e.altKey) {
            editor.clearScore();
        }
    }

    useListenerOnWindow(window, 'keydown', onKeyDown);
    useListenerOnWindow(window, 'mouseup', onInteractionEnd);
    useListenerOnWindow(window, 'blur', onInteractionEnd);
    useListenerOnWindow(window, 'mouseleave', onInteractionEnd);

    useEffect(() => {
        if (containerRef.current !== null) {
            containerRef.current.scrollTop = 610;
        }
    });

    return (<div id="notes-editor" ref={containerRef}>
        <div id="piano-note-names"> {new Array(88).fill(null).map((_, i) => <span
            key={`note-name-${i}`}></span>)} </div>
        <div id="piano-notes">
            {createArray(scoreData.length, i =>
                <RenderWhenVisible key={i} placeholderSupplier={
                    (ref : RefObject<HTMLDivElement>) => <div className={"piano-notes-column piano-notes-column-placeholder"} ref={ref}></div>
                }>
                    <NoteEditorColumn columnIndex={i}/>
                </RenderWhenVisible>
            )}
        </div>
        <div id="piano-notes-end-space"></div>
    </div>);
}

const NoteEditorKeyDisplay = memo(function NoteEditorKeyDisplay({commands}: { commands: InstrumentCommand[] }) {
    return <>{
        commands.map((command, i) =>
            [
                null,
                <span className={`voice-${i + 1} begin`} key={i}/>,
                <span className={`voice-${i + 1} hold`} key={i}/>,
                <span className={`voice-${i + 1} end`} key={i}/>,
                <span className={`voice-${i + 1} dot`} key={i}/>,
            ][command]
        )
    }</>
}, (a: {commands: InstrumentCommand[]}, b: {commands: InstrumentCommand[]}) => arraysEqual(a.commands, b.commands));

function NoteEditorKey({columnIndex, noteIndex}: {
    columnIndex: number,
    noteIndex: number
}) {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;

    const [dummyState, setDummyState] = useState(0);

    editor.setUIUpdateCallback(columnIndex, noteIndex, () => setDummyState(dummyState + 1));

    const commands = editor.scoreData.noteData.map(data =>
        data.getCommand(columnIndex, noteIndex).command
    );

    return (
        <span className="piano-notes-key" onMouseDown={e => {
            editor.startInteraction(columnIndex, noteIndex, e.button === 0 ? e.ctrlKey ? 'blend' : 'write' : 'erase');
            setDummyState(dummyState + 1);
        }}>
            <NoteEditorKeyDisplay commands={commands}></NoteEditorKeyDisplay>
        </span>
    );
}

function NoteEditorColumn({columnIndex}: { columnIndex: number }) {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;

    const [dummyState, setDummyState] = useState(0);

    return (
        <div
            className="piano-notes-column"
            onMouseEnter={() => {
                editor.mouseEnterColumn(columnIndex);
                setDummyState(dummyState + 1);
            }}
        >
            {new Array(88).fill(null).map((_, i) => <NoteEditorKey key={i} columnIndex={columnIndex}
                                                                   noteIndex={i}/>)}
        </div>
    );
}