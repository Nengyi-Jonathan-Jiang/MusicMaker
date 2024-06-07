"use client";

import {createContext} from 'react'
import {clamp, getFirstElementFromSet} from "@/app/lib/util";

export interface IScrollSyncer {
    registerPane(pane: ScrollPane): void;

    unregisterPane(pane: ScrollPane): void;
}

export const DummyScrollSyncer: IScrollSyncer = {registerPane: () => void 0, unregisterPane: () => void 0}

export const ScrollSyncContext = createContext<IScrollSyncer>(DummyScrollSyncer)

type ScrollSyncerOptions = {
    syncX?: boolean,
    syncY?: boolean
};

export class ScrollPane {
    readonly #element: HTMLElement;

    constructor(element: HTMLElement) {
        this.#element = element;
    }

    get scrollableAmountX(): number {
        return this.element.scrollWidth - this.element.clientWidth;
    }

    get scrollableAmountY(): number {
        return this.element.scrollHeight - this.element.clientHeight;
    }

    get scrollAmountX(): number {
        return this.element.scrollLeft;
    }

    set scrollAmountX(amount: number) {
        this.element.scrollLeft = clamp(amount, 0, this.scrollableAmountX);
    }

    get scrollAmountY(): number {
        return this.element.scrollTop;
    }

    set scrollAmountY(amount: number) {
        this.element.scrollTop = clamp(amount, 0, this.scrollableAmountY);
    }

    get scrollProportionX(): number {
        return this.element.scrollLeft / this.scrollableAmountX;
    }

    set scrollProportionX(proportion: number) {
        this.element.scrollLeft = clamp(proportion, 0, 1) * this.scrollableAmountX;
    }

    get scrollProportionY(): number {
        return this.element.scrollTop / this.scrollableAmountY;
    }

    set scrollProportionY(proportion: number) {
        this.element.scrollTop = clamp(proportion, 0, 1) * this.scrollableAmountY;
    }

    get element() {
        return this.#element;
    }
}

abstract class AbstractScrollSyncer implements IScrollSyncer {
    readonly #panes: Set<ScrollPane> = new Set;
    readonly #syncX: boolean;
    readonly #syncY: boolean;

    protected constructor({syncX = true, syncY = true}: ScrollSyncerOptions = {}) {
        this.#syncX = syncX ?? true;
        this.#syncY = syncY ?? true;
    }

    #syncScrollPosition(sourcePane: ScrollPane, destPane: ScrollPane) {
        if (this.#syncY)
            this.syncY(sourcePane, destPane);
        if (this.#syncX)
            this.syncX(sourcePane, destPane)
    }
    
    protected abstract syncY(sourcePane: ScrollPane, destPane: ScrollPane) : void;
    protected abstract syncX(sourcePane: ScrollPane, destPane: ScrollPane) : void;

    #handlePaneScroll(pane: ScrollPane) {
        window.requestAnimationFrame(() => {
            this.#panes.forEach(i => {
                if (i !== pane) {
                    this.#syncScrollPosition(pane, i);
                }
            });
        })
    }

    registerPane(pane: ScrollPane) {
        if (this.#panes.size > 0) {
            this.#syncScrollPosition(getFirstElementFromSet(this.#panes), pane);
        }

        pane.element.onscroll = () => {
            this.#handlePaneScroll(pane);
        }
    }

    unregisterPane(pane: ScrollPane) {
        this.#panes.delete(pane);
        pane.element.onscroll = null;
    }
}

export class ProportionalScrollSyncer extends AbstractScrollSyncer {
    public constructor(props ?: ScrollSyncerOptions) {
        super(props ?? {});
    }

    protected syncY(sourcePane: {readonly scrollProportionY: number}, destPane: {scrollProportionY: number}) {
        destPane.scrollProportionY = sourcePane.scrollProportionY;
    }

    protected syncX(sourcePane: {readonly scrollProportionX: number}, destPane: {scrollProportionX: number}) {
        destPane.scrollProportionX = sourcePane.scrollProportionX;
    }
}

export class AbsoluteScrollSyncer extends AbstractScrollSyncer{
    public constructor(props ?: ScrollSyncerOptions) {
        super(props ?? {});
    }

    protected syncY(sourcePane: ScrollPane, destPane: ScrollPane) {
        destPane.scrollAmountY = sourcePane.scrollAmountY;
    }

    protected syncX(sourcePane: ScrollPane, destPane: ScrollPane) {
        destPane.scrollAmountX = sourcePane.scrollAmountX;
    }
}