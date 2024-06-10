"use client"

import './ui.css'
import './style.css'

import React, {useEffect} from "react";
import LoadingScreen from "@/app/ui/loadingScreen";
import {MusicEditor} from "@/app/ui/music-editor/musicEditor";

export default function Page() {
    return (
        <div id="main">
            <LoadingScreen>
                <MusicEditor></MusicEditor>
            </LoadingScreen>
        </div>
    );
}
