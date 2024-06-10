"use client"

import React, {useState} from "react";
import {ScoreEditor} from "@/app/logic/editor/scoreEditor";
import {Controls} from "@/app/ui/music-editor/general-controls/controls";
import {NoteEditorDisplay} from "@/app/ui/music-editor/note-editor/note-editor-display";
import {DynamicsControl} from "@/app/ui/music-editor/dynamic-control/dynamicsControl";
import {ScrollSyncContext, AbsoluteScrollSyncer} from "@/app/lib/scrollSync";
import {NoteEditor} from "@/app/logic/editor/noteEditor";
import {useListenerOnWindow} from "@/app/lib/util";

export const ScoreEditorContext = React.createContext<ScoreEditor | null>(null);
export const NoteEditorContext = React.createContext<NoteEditor | null>(null);

export function MusicEditor() {
    const [scoreEditor] = useState(() => new ScoreEditor(6 * 4 * 64));
    const noteEditor = scoreEditor.noteEditor;
    const [scrollSyncer] = useState(() => new AbsoluteScrollSyncer({syncY: false}));

    useListenerOnWindow(window, 'keydown', e => {
        if (e.key === ' ') {
            if (scoreEditor.isPlaying) {
                scoreEditor.stopPlayScore();
            } else {
                scoreEditor.playScore(scrollSyncer);
            }

            e.preventDefault();
            e.stopPropagation();
        }
        if (e.key === 'R' && e.ctrlKey) {
            scoreEditor.clearScore();
            e.preventDefault();
        }
    });


    return (<div id="music-editor" onContextMenu={e => e.preventDefault()}>
        <ScoreEditorContext.Provider value={scoreEditor}>
            <ScrollSyncContext.Provider value={scrollSyncer}>
                <Controls/>

                <NoteEditorContext.Provider value={noteEditor}>
                    <NoteEditorDisplay/>
                </NoteEditorContext.Provider>

                <DynamicsControl/>
            </ScrollSyncContext.Provider>
        </ScoreEditorContext.Provider>
    </div>);
}