import React, {RefObject, useContext} from "react";

import {ScoreEditorContext} from "@/app/ui/music-editor/musicEditor";
import {ScoreEditor} from "@/app/logic/scoreEditor";
import {createArray} from "@/app/lib/util";
import {RenderWhenVisible} from "@/app/ui/renderWhenVisible";

function DynamicsColumn({columnIndex}: { columnIndex: number }) {
    return <div className="dynamics-column">

    </div>;
}

export function DynamicsControl() {
    const editor = useContext(ScoreEditorContext) as ScoreEditor;

    return <>
        <div id="dynamic-control">
            <div id="dynamic-control-left">
            </div>

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
    </>;
}