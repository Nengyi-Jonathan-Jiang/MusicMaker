import {ScoreEditor} from "@/app/logic/editor/scoreEditor";

export abstract class ScoreEditorComponent {
    readonly #editor: ScoreEditor;

    protected constructor(editor: ScoreEditor) {
        this.#editor = editor;
    }

    protected get editor() {
        return this.#editor;
    }

    protected get scoreData() {
        return this.editor.scoreData;
    }

    public get length() {
        return this.scoreData.length;
    }
}