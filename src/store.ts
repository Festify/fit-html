import { Store } from 'redux';

import { ClassConstructor } from '.';

/**
 * Creates a subclass of the given HTML element that supplies the redux store to
 * its DOM children.
 *
 * When connected to the document, 💪-elements walk the dom upwards until they
 * either find another 💪-element that already has an initialized redux store
 * or the store provider element. They then take the store from that given
 * element, subscribe to the store for rendering and cache it for further lookups
 * or potential 💪-children.
 * It works just like react-redux and its
 * {@see https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store}
 * element.
 *
 * You usually only need one per application as you would usually only use one
 * redux store per application. You're free to use as many as you like though.
 *
 * As 💪-html components will always use the store from the closest provider element above them,
 * you can also nest them into each other. See the following example:
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
 *         <fit-element-2>
 *            <!--
 *                fit-element-3 gets its store from fit-element-2, which got
 *                its store from sub-shell.
 *            -->
 *            <fit-element-3></fit-element-3>
 *         </fit-element-2>
 *     </sub-shell>
 * </app-shell>
 * ```
 *
 * @param {Store<S>} store The redux store.
 * @returns {<T extends <HTMLElement>>(clazz: T) => {new(): {getStore(): Store<S>}}} The actual decorator function.
 * @template S, T
 */
export default function withStore<S>(store: Store<S>) {
    return <T extends ClassConstructor<HTMLElement>>(clazz: T) => class extends clazz {
        getStore(): Store<S> {
            return store;
        }
    };
}
