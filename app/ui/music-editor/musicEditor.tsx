"use client"

import React, {useState} from "react";
import {ScoreEditor} from "@/app/logic/scoreEditor";
import {Controls} from "@/app/ui/music-editor/general-controls/controls";
import {NoteEditor} from "@/app/ui/music-editor/note-editor/note-editor";
import {DynamicsControl} from "@/app/ui/music-editor/dynamic-control/dynamicsControl";
import {ScrollSyncContext, AbsoluteScrollSyncer} from "@/app/lib/scrollSync";

export const ScoreEditorContext = React.createContext<ScoreEditor | null>(null);

export function MusicEditor() {
    const [scoreEditor] = useState(() => new ScoreEditor(6 * 4 * 64));
    const [scrollSyncer] = useState(() => new AbsoluteScrollSyncer());



    return (<div id="music-editor" onContextMenu={e => e.preventDefault()}>
        <ScoreEditorContext.Provider value={scoreEditor}>
            <ScrollSyncContext.Provider value={scrollSyncer}>
                <Controls/>
                <NoteEditor/>
                <DynamicsControl/>
            </ScrollSyncContext.Provider>
        </ScoreEditorContext.Provider>
    </div>);
}