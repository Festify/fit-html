import { Store } from 'redux';

import { ClassConstructor } from '.';

/**
 * Creates a subclass of the given HTML element that supplies the redux store to its DOM children.
 *
 * Thus, all other 💪-elements must be a child of that element.
 * It works much like {@see https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store}.
 *
 * When connected to the document, 💪-elements walk the dom upwards until they
 * either find another 💪-element that already has an initialized redux store
 * or the store provider element. They then take the store from that given
 * element, subscribe to the store for rendering and cache it for further lookups
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
 * <app-shell>
 *     <!-- These two elements use the store from app-shell -->
 *     <fit-element-1></fit-element-1>
 *     <fit-element-2></fit-element-2>
 *
 *     <sub-shell>
 *         <!-- These two elements use the store from sub-shell -->
 *         <fit-element-1></fit-element-1>
 *         <fit-element-2></fit-element-2>
 *     </sub-shell>
 * </app-shell>
 * ```
 *
 * @param {T} clazz The base class to extend from.
 * @param {Store<S>} store The redux store.
 * @returns {ProviderElement<S>} The redux store provider element class.
 * @template S
 */
export function withStore<T extends ClassConstructor<HTMLElement>, S>(clazz: T, store: Store<S>) {
    return class extends clazz {
        getStore(): Store<S> {
            return store;
        }
    };
}

/**
 * Creates a new HTML element that supplies the redux store to its DOM children.
 *
 * Thus, all other 💪-elements must be a child of that element.
 *
 * @param {Store<S>} store The redux store.
 * @deprecated Use `withStore` on your app shell / root element instead.
 */
export const createProvider = <S>(store: Store<S>) => withStore(HTMLElement, store);
export default createProvider;
