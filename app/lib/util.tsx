import {DependencyList, useEffect, useState} from "react";

/**
 * Creates an array with a specified length and fills it with values.
 * @param length The length of the array to be created
 * @param value If this is a function, it will be with each index in the range [0, length) to populate the array.
 *              Otherwise, the array will be filled with this value.
 */
export function createArray<T>(length: number, value: T | ((index: number) => T)): T[] {
    return typeof value === "function"
        ? new Array(length).fill(null).map((_, i) => (value as (index : number) => T)(i))
        : new Array(length).fill(value);
}

export function arraysEqual<T>(a: T[], b: T[]) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * A custom react hook. Returns a function `rerender()` which forces the component to update
 */
export function useManualRerender(): () => void {
    const [dummy, setDummy] = useState(0);
    return () => setDummy(dummy + 1);
}

/**
 * A custom react hook. Equivalent to
 * <pre>
 * useEffect(() => {
 *     window.addEventListener(listenerType, listener);
 *
 *     return () => {
 *         window.removeEventListener(listenerType, listener);
 *     }
 * }, dependencies ?? []);
 * </pre>
 */
export function useListenerOnWindow<K extends keyof WindowEventMap>(
    window: Window,
    listenerType: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    dependencies ?: DependencyList
): void {
    useEffect(() => {
        window.addEventListener(listenerType, listener);

        return () => {
            window.removeEventListener(listenerType, listener);
        }
    }, dependencies ?? []);
}

export function getCurrTimeSeconds(): number {
    return Date.now() / 1000;
}

// noinspection JSUnusedGlobalSymbols
/**
 * A wrapper around a vanilla {@link Promise} that exposes two new properties:
 * - isFinished : Whether the promise has resolved successfully
 * - value : The value that the promise resolved with. Attempting to access this before the AsyncTask is finished
 * throws an error.
 */
export class AsyncTask<T> implements PromiseLike<T> {
    #value: T | null = null;
    #isFinished: boolean = false;

    readonly #promiseProvider : () => Promise<T>;
    #promise : Promise<T> | null = null;

    #started: boolean = false;

    /**
     * Creates a task from the promise obtained by executing the given function
     *
     * If lazy is true, the function will not be executed until the task is used 
     * (i.e, its methods are called or its properties are accessed) 
     */
    constructor(promiseProvider: () => Promise<T>, lazy: boolean = false) {
        this.#promiseProvider = promiseProvider;
        if(!lazy) {
            this.start();
        }
    }

    /**
     * Creates a task from an executor. Equivalent to <code> new AsyncTask<T>(new Promise(executor)) </code>
     */
    static fromExecutor<T>(executor: (resolve: (value: T | PromiseLike<T>) => void) => any, lazy : boolean = false) : AsyncTask<T> {
        return new AsyncTask<T>(() => new Promise(executor), lazy);
    }

    /**
     * If the task has not started yet (due to the lazy parameter being true), starts the task.
     */
    start() {
        if(this.#started) {
            return;
        }

        this.#started = true;

        this.#promise = this.#promiseProvider();

        this.#promise.then((value) => {
            this.#value = value;
            this.#isFinished = true;
        });
    }

    get #startedPromise() : Promise<T> {
        return this.#promise as Promise<T>;
    }

    /**
     * Calls the given function when the task completes, or immediately if the task is already completed.
     * Note that this differs from {@link Promise.then}, which would invoke callback after the event loop
     * turn in which `then` is called if the task is already completed
     */
    onFinished(callback: (value: T) => any): void {
        this.start();
        if(this.isFinished) {
            callback.call(undefined, this.#value as T);
        }
        else {
            this.#startedPromise.then(callback);
        }
    }

    // noinspection SpellCheckingInspection
    /**
     * See {@link Promise.then}
     */
    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): Promise<TResult1 | TResult2> {
        return this.#startedPromise.then(onfulfilled, onrejected);
    }

    /**
     * Whether the task is finished
     */
    get isFinished(): boolean {
        this.start();
        return this.#isFinished;
    }

    /**
     * The result of the task.
     * If the task is not finished, throws an error
     */
    get value(): T {
        if (!this.isFinished) {
            throw new Error("Cannot access task result before task is finished")
        }
        return this.#value as T;
    }
}

export class AsyncTaskWithDefault<T> extends AsyncTask<T> {
    readonly #defaultValue: T;

    constructor(promiseProvider: () => Promise<T>, defaultValue: T, lazy : boolean = false) {
        super(promiseProvider, lazy);
        this.#defaultValue = defaultValue;
    }

    /**
     * Creates a task from an executor. Equivalent to <code>
     *     new AsyncTaskWithDefault<T>(new Promise(executor), defaultValue)
     * </code>
     */
    static fromExecutorAndDefaultValue<T>(
        executor: (resolve: (value: T | PromiseLike<T>) => void) => any,
        defaultValue: T,
        lazy : boolean = false
    ) : AsyncTaskWithDefault<T> {
        return new AsyncTaskWithDefault<T>(() => new Promise(executor), defaultValue, lazy);
    }

    /**
     * The result of the task.
     * If the task is not finished, returns the default value provided
     */
    get value() : T {
        if (this.isFinished) {
            return super.value;
        } else {
            return this.#defaultValue;
        }
    }
}