import {PropsWithChildren, ReactNode, RefObject, useEffect, useRef, useState} from "react";

const observationCallbacks = new Map<Element, () => void>;

const observer = new IntersectionObserver((entries) => {
    entries.forEach(({target: element, isIntersecting}) => {
        if(isIntersecting) {
            const callBack = observationCallbacks.get(element);

            removeObservedElement(element);

            if(callBack) {
                callBack();
            }
        }
    })
});

function addObservedElement(element : Element, callback : () => void){
    observationCallbacks.set(element, callback);
    observer.observe(element);
}

function removeObservedElement(element : Element){
    observationCallbacks.delete(element);
    observer.unobserve(element);
}

export function LazyLoader<ElementType extends Element>({children, placeholderSupplier}: PropsWithChildren<{placeholderSupplier: (ref : RefObject<ElementType>) => ReactNode}>) {
    const [hasBeenObserved, setHasBeenObserved] = useState(false);
    const placeholderRef = useRef<ElementType>(null);

    useEffect(() => {
        if (!placeholderRef.current) {
            throw new Error("Placeholder ref must have an element");
        }

        addObservedElement(placeholderRef.current, () => setHasBeenObserved(true));

        return () => {
            if(placeholderRef.current) {
                removeObservedElement(placeholderRef.current);
            }
        }
    }, []);

    return <>
        {
            hasBeenObserved ? children : placeholderSupplier(placeholderRef)
        }
    </>
}