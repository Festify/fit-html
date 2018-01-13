import { Store } from 'redux';

/**
 * A 💪 redux store provider element.
 */
export declare class ProviderElement<S> extends HTMLElement {
    /**
     * The previously created redux store to be accessible for all children.
     */
    reduxStore: Store<S>;
}

/**
 * Creates a new redux store provider element using the given store.
 *
 * All 💪-elements must be a child of this element.
 *
 * @param {Store<S>} store The redux store.
 * @returns {ProviderElement<S>} The redux store provider element.
 * @template S
 */
export default function createProvider<S>(store: Store<S>): ProviderElement<S> {
    return class extends HTMLElement {
        get reduxStore(): Store<S> {
            return store;
        }
    } as any;
}
