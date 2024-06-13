import './note-editor.css'

import React, {memo, RefObject, useContext, useEffect, useRef, useState} from "react";
import {arraysEqual, createArray, useListenerOnWindow} from "@/app/lib/util";
import {NoteCommand} from "@/app/logic/voiceData";
import {NoteEditorContext} from "@/app/ui/music-editor/musicEditor";
import {RenderWhenVisible} from "@/app/ui/renderWhenVisible";
import {ScrollPane, ScrollSyncContext} from "@/app/lib/scrollSync";
import {NoteEditor, NoteEditorInteractionType} from "@/app/logic/editor/noteEditor";

function PlaceholderNoteEditorColumn({elementRef}: { elementRef: React.RefObject<HTMLDivElement> }) {
    return <div className={"piano-notes-column piano-notes-column-placeholder"} ref={elementRef}></div>;
}

export function NoteEditorDisplay() {
    const scrollSyncer = useContext(ScrollSyncContext);

    const editor = useContext(NoteEditorContext) as NoteEditor;
    const containerRef = useRef<HTMLDivElement>(null);

    function onInteractionEnd() {
        editor.endInteraction();
    }

    useListenerOnWindow(window, 'mouseup', onInteractionEnd);
    useListenerOnWindow(window, 'blur', onInteractionEnd);
    useListenerOnWindow(window, 'mouseleave', onInteractionEnd);

    useEffect(() => {
        if (containerRef.current === null) return;

        containerRef.current.scrollTop = 610;
        const pane = new ScrollPane(containerRef.current);
        scrollSyncer.registerPane(pane);

        return () => {
            scrollSyncer.unregisterPane(pane);
        }
    });

    return (<div id="notes-editor" ref={containerRef}>
        <div id="piano-note-names"> {new Array(88).fill(null).map((_, i) => <span
            key={`note-name-${i}`}></span>)} </div>
        <div id="piano-notes">
            {createArray(editor.scoreData.length, i =>
                <RenderWhenVisible key={i} placeholderSupplier={
                    (ref: RefObject<HTMLDivElement>) => <PlaceholderNoteEditorColumn elementRef={ref}/>
                }>
                    <NoteEditorColumn columnIndex={i}/>
                </RenderWhenVisible>
            )}
        </div>
        <div id="piano-notes-end-space"></div>
    </div>);
}

const NoteEditorKeyDisplay = memo(function NoteEditorKeyDisplay({commands}: { commands: NoteCommand[] }) {
    return commands.map((command, i) =>
        [
            null,
            <span className={`voice-${i + 1} begin`} key={i}/>,
            <span className={`voice-${i + 1} hold`} key={i}/>,
            <span className={`voice-${i + 1} end`} key={i}/>,
            <span className={`voice-${i + 1} dot`} key={i}/>,
        ][command]
    );
}, (a: { commands: NoteCommand[] }, b: { commands: NoteCommand[] }) => arraysEqual(a.commands, b.commands));

function NoteEditorKey({columnIndex, noteIndex}: {
    columnIndex: number,
    noteIndex: number
}) {
    const editor = useContext(NoteEditorContext) as NoteEditor;

    const [dummyState, setDummyState] = useState(0);

    editor.setUIUpdateCallback(columnIndex, noteIndex, () => setDummyState(dummyState + 1));

    const commands = editor.scoreData.voiceData.map(data =>
        data.getNoteCommand(columnIndex, noteIndex).command
    );

    return (
        <span className="piano-notes-key" onMouseDown={e => {
            editor.startInteraction(columnIndex, noteIndex, (
                e.button === 0 ?
                    e.ctrlKey ? NoteEditorInteractionType.Blend :
                        NoteEditorInteractionType.Write :
                    NoteEditorInteractionType.Erase
            ));
            setDummyState(dummyState + 1);
        }}>
            <NoteEditorKeyDisplay commands={commands}></NoteEditorKeyDisplay>
        </span>
    );
}

function NoteEditorColumn({columnIndex}: { columnIndex: number }) {
    const editor = useContext(NoteEditorContext) as NoteEditor;

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