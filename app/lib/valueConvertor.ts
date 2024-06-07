
export abstract class ValueConvertor {
    abstract convertForwards(amountA: number): number;
    abstract convertBackwards(amountB: number): number;

    static compose(...convertors: ValueConvertor[]) : ValueConvertor {
        return new ComposedValueConvertor(...convertors);
    }

    static invert(convertor: ValueConvertor) {
        return new InvertedValueConvertor(convertor);
    }
}

class ComposedValueConvertor implements ValueConvertor {
    private readonly convertors: ValueConvertor[];
    constructor(...convertors : ValueConvertor[]) {
        this.convertors = convertors;
    }

    convertForwards(amountA: number): number {
        return this.convertors.reduce((amount, convertor) => convertor.convertForwards(amount), amountA);
    }

    convertBackwards(amountB: number): number {
        return this.convertors.reduce((amount, convertor) => convertor.convertBackwards(amount), amountB);
    }
}

class InvertedValueConvertor implements ValueConvertor {
    private readonly baseConvertor: ValueConvertor;

    constructor(convertor: ValueConvertor) {
        this.baseConvertor = convertor;
    }

    convertForwards(amountA: number): number {
        return this.baseConvertor.convertBackwards(amountA);
    }

    convertBackwards(amountB: number): number {
        return this.baseConvertor.convertForwards(amountB);
    }
}


export class LinearValueConvertor implements ValueConvertor {
    readonly #factor: number;
    readonly #offset: number;

    /**
     * Represents a linear unit conversion.
     *
     * If {@link applyOffsetFirst} is true, convertForwards(x) returns `x * factor + offset`,
     * otherwise, it returns `(x + offset) * factor`
     */
    constructor(factor: number, offset: number = 0, applyOffsetFirst = false) {
        this.#factor = factor;
        this.#offset = applyOffsetFirst ? factor * offset : offset;
    }

    convertForwards(amountA: number) {
        return amountA * this.#factor + this.#offset;
    }

    convertBackwards(amountB: number) {
        return (amountB - this.#offset) / this.#factor;
    }
}