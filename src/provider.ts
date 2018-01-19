import { Store } from 'redux';

import { ClassConstructor } from '.';

/**
 * A 💪 redux store provider element.
 *
 * This element supplies the redux store to the 💪-html elements below it.
 * It works much like {@see https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store}.
 *
 * When connected to the document, 💪-elements walk the dom upwards until they
 * either find another 💪-element that already has an initialized redux store
 * or the store provider element. They then take the store from that given
 * element, subscribe to it for rendering and cache it for further lookups
 * or potential 💪-children.
 *
 * You usually only need one per application as you would usually only use one
 * redux store per application. You're free to use as many as you like though.
 *
 * You can also nest them into each other. 💪-html components will always use
 * the store from the closest provider element above them. See the following
 * example:
 *
 * @example
 * ```html
 * <redux-provider-top-level>
 *     <!-- These two elements use the store from redux-provider-top-level -->
 *     <fit-element-1></fit-element-1>
 *     <fit-element-2></fit-element-2>
 *
 *     <redux-provider-sub-level>
 *         <!-- These two elements use the store from redux-provider-sub-level -->
 *         <fit-element-2></fit-element-1>
 *         <fit-element-2></fit-element-2>
 *     </redux-provider-sub-level>
 * </redux-provider-top-level>
 * ```
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
 * This element supplies the redux store to the 💪-html elements below it.
 * Thus, all 💪-elements must be a child of this element.
 *
 * @param {Store<S>} store The redux store.
 * @returns {ProviderElement<S>} The redux store provider element class.
 * @template S
 */
export default function createProvider<S>(store: Store<S>): ClassConstructor<ProviderElement<S>> {
    return class extends HTMLElement {
        get reduxStore(): Store<S> {
            return store;
        }
    };
}
