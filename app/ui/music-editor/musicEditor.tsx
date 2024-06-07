"use client"

import React, {useContext, useState} from "react";
import {ScoreEditor} from "@/app/logic/scoreEditor";
import {Controls} from "@/app/ui/music-editor/controls";
import {NoteEditor} from "@/app/ui/music-editor/note-editor/note-editor";
import {DynamicsControl} from "@/app/ui/music-editor/dynamic-control/dynamicsControl";
import {useListenerOnWindow} from "@/app/lib/util";

export const ScoreEditorContext = React.createContext<ScoreEditor | null>(null);

export function MusicEditor() {
    const [scoreEditor] = useState(() => new ScoreEditor(6 * 4 * 64));

    return (<div id="music-editor" onContextMenu={e => e.preventDefault()}>
        <ScoreEditorContext.Provider value={scoreEditor}>
            <Controls/>
            <NoteEditor/>
            <DynamicsControl/>
        </ScoreEditorContext.Provider>
    </div>);
}