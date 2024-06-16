"use client"

import {createContext, useState} from "react";
import {ScoreEditor} from "@/app/logic/editor/scoreEditor";
import {Controls} from "@/app/ui/music-editor/general-controls/controls";
import {NoteEditorDisplay} from "@/app/ui/music-editor/note-editor/note-editor-display";
import {DynamicsControl} from "@/app/ui/music-editor/dynamic-control/dynamicsControl";
import {ScrollSyncContext, AbsoluteScrollSyncer} from "@/app/lib/react-utils/scrollSync";
import {NoteEditor} from "@/app/logic/editor/noteEditor";
import {useListenerOnWindow} from "@/app/lib/utils/util";
import {ContinuousDynamicsEditor} from "@/app/logic/editor/continuousDynamicsEditor";

export const ScoreEditorContext = createContext<ScoreEditor | null>(null);
export const NoteEditorContext = createContext<NoteEditor | null>(null);
export const ContinuousDynamicsEditorContext = createContext<ContinuousDynamicsEditor | null>(null);

export function MusicEditor() {
    const [scrollSyncer] = useState(() => new AbsoluteScrollSyncer({syncY: false}));

    const [scoreEditor] = useState(() => new ScoreEditor(6 * 4 * 64));

    const noteEditor = scoreEditor.noteEditor;
    const dynamicsEditor = scoreEditor.continuousDynamicsEditor;

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

                <ContinuousDynamicsEditorContext.Provider value={dynamicsEditor}>
                    <DynamicsControl/>
                </ContinuousDynamicsEditorContext.Provider>
            </ScrollSyncContext.Provider>
        </ScoreEditorContext.Provider>
    </div>);
}