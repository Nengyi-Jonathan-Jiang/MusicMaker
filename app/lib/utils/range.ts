import {createArray} from "@/app/lib/utils/util";
import {bindToThis} from "@/app/lib/utils/decorators";

export interface ReadonlyRange {
    readonly valuesInRange: number[];
    readonly endpoints: number[];
    readonly length: number;
    readonly start: number;
    readonly end: number;
    readonly startExclusive: number;
    readonly endExclusive: number;

    trimmedToRange(interval: ReadonlyRange): Range;
}

export class Range implements ReadonlyRange {
    #start: number = 0;
    #end: number = 0;

    constructor();
    constructor(startInclusive: number, endInclusive: number);
    constructor(startInclusive: number = 0, endInclusive: number = 0) {
        this.#start = startInclusive;
        this.#end = endInclusive;
    }

    get valuesInRange(): number[] {
        return createArray(this.length, i => i + this.start);
    }

    [Symbol.iterator](): Iterator<number> {
        return this.valuesInRange[Symbol.iterator]();
    }

    map<T>(func: (this: null, value: number) => T): T[] {
        return this.valuesInRange.map(func.bind(null));
    }

    forEach(func: (this: null, value: number) => any): void {
        for (const value of this) {
            func.call(null, value);
        }
    }

    includes(x : number) : boolean {
        return x >= this.start && x <= this.end;
    }

    /** The start and end of the interval (inclusive) as a tuple of two numbers */
    get endpoints(): [number, number] {
        return [this.start, this.end];
    }

    get length(): number {
        return this.end - this.start + 1;
    }

    get start(): number {
        return this.#start;
    }

    set start(start: number) {
        this.#start = start;
    }

    setStart(start: number): this {
        this.start = start;
        return this;
    }

    modifyStart(mappingFunction: (this: null, start: number) => any): this {
        this.start = mappingFunction.call(null, this.start);
        return this;
    }

    get end() {
        return this.#end;
    }

    set end(end) {
        this.#end = end;
    }

    setEnd(end: number) {
        this.end = end;
        return this;
    }

    modifyEnd(mappingFunction: (this: null, start: number) => any): this {
        this.end = mappingFunction.call(null, this.end);
        return this;
    }

    get startExclusive() {
        return this.#start - 1;
    }

    set startExclusive(startExclusive: number) {
        this.#start = startExclusive + 1;
    }

    setStartExclusive(startExclusive: number) {
        this.startExclusive = startExclusive;
        return this;
    }

    modifyStartExclusive(mappingFunction: (this: null, start: number) => any): this {
        this.startExclusive = mappingFunction.call(null, this.startExclusive);
        return this;
    }

    get endExclusive() {
        return this.#end + 1;
    }

    set endExclusive(endExclusive: number) {
        this.#end = endExclusive - 1;
    }

    setEndExclusive(endExclusive: number) {
        this.endExclusive = endExclusive;
        return this;
    }

    modifyEndExclusive(mappingFunction : (this: null, start: number) => any) : this {
        this.endExclusive = mappingFunction.call(null, this.endExclusive);
        return this;
    }

    copy() {
        return new Range().setStart(this.start).setEnd(this.end);
    }

    trimToRange(interval: ReadonlyRange) {
        this.start = Math.max(this.start, interval.start);
        this.end = Math.min(this.end, interval.end);
        return this;
    }

    trimmedToRange(interval: ReadonlyRange) {
        return this.copy().trimToRange(interval);
    }

    static fromEndpoints(p1: number, p2: number) {
        return new Range()
            .setStart(Math.min(p1, p2))
            .setEnd(Math.max(p1, p2))
    }

    static fromEndpointsExclusive(p1: number, p2: number) {
        return new Range()
            .setStartExclusive(Math.min(p1, p2))
            .setEndExclusive(Math.max(p1, p2))
    }

    static fromEndpointsWithStartExclusive(p1: number, p2: number) {
        return new Range()
            .setStartExclusive(Math.min(p1, p2))
            .setEnd(Math.max(p1, p2))
    }

    static fromEndpointsWithEndExclusive(p1: number, p2: number) {
        return new Range()
            .setStart(Math.min(p1, p2))
            .setEndExclusive(Math.max(p1, p2))
    }

    static forIndicesOf(arrayLike: {length: number}) {
        return new Range(0, arrayLike.length - 1);
    }
}