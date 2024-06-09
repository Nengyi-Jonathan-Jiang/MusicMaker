export const eventsHelper: {
    readonly keysDown: Set<string>,
    mouseDown: boolean,
    mousePos: [number, number] | null,
    initializeFor: (el: EventTarget) => void
} = {
    keysDown: new Set,
    mouseDown: false,
    mousePos: null,
    initializeFor(target: EventTarget) {
        function updateMousePos(e: MouseEvent) {
            eventsHelper.mousePos = [e.clientX, e.clientY];
        }

        target.addEventListener("keydown", (e => {
            eventsHelper.keysDown.add((e as KeyboardEvent).key);
        }));
        target.addEventListener("keyup", (e => {
            eventsHelper.keysDown.delete((e as KeyboardEvent).key);
        }));
        target.addEventListener("mousedown", (e => {
            eventsHelper.mouseDown = true;
            updateMousePos(e as MouseEvent);
        }));
        target.addEventListener("mousemove", (e => {
            updateMousePos(e as MouseEvent);
        }));
        target.addEventListener("mouseup", (e => {
            eventsHelper.mouseDown = false;
            updateMousePos(e as MouseEvent);
        }));
        target.addEventListener("blur", (() => {
            eventsHelper.keysDown.clear();
            eventsHelper.mouseDown = false;
            eventsHelper.mousePos = null;
        }));
    }
};