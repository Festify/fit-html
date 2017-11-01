import { Store } from 'redux';

export interface ProviderElement<S> extends HTMLElement, Function {
    reduxStore: Store<S>;
}

export default function createProvider<S>(store: Store<S>): ProviderElement<S> {
    return class extends HTMLElement {
        reduxStore: Store<S> = store;
    } as any;
}
