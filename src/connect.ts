import { render, PartCallback, TemplateResult } from 'lit-html';
import { render as shadyRender } from 'lit-html/lib/shady-render';
import { bindActionCreators, ActionCreatorsMapObject, Dispatch, Store, Unsubscribe } from 'redux';

import { ClassConstructor } from '.';

/**
 * The function that extracts required data out of the state and the passed props.
 */
export type MapStateToPropsFn<S, P, OP> = (state: S, ownProps: OP) => P;

/**
 * The function that sets up the view actions based on the store's dispatch function.
 */
export type MapDispatchToPropsFn<S, P, OP> = (dispatch: Dispatch<S>, ownProps: OP) => P;

/**
 * A factory method for creating a specialized {@ref MapStateToPropsFn<S, P, OP>}
 * for every instance of the component.
 *
 * Will be invoked at component construction time.
 */
export type MapStateToPropsFactory<S, P, OP> = () => MapStateToPropsFn<S, P, OP>;

/**
 * A lit-html rendering function.
 */
export type RenderFunction = typeof render;

/**
 * A 💪 web component.
 *
 * @template {S} The type of the redux state.
 * @template {P} The type of the view properties.
 * @template {OP} The type of the own properties passed to the element from the outside.
 */
export declare class FitElement<S, P, OP> extends HTMLElement {
    constructor(...args: any[]);

    connectedCallback();
    disconnectedCallback();

    /**
     * Enqueues the component for rendering at microtask timing.
     *
     * Multiple calls to this method within a microtask will be ignored.
     */
    enqueueRender();

    /**
     * Obtains the redux store.
     *
     * The dom is traversed upwards until either another 💪-html element or
     * the redux store provider element is found. As such, it may not be invoked
     * until the component has been attached to the document (respectively only
     * during / after connectedCallback has fired).
     *
     * @returns {Store<S>} The redux store.
     */
    getStore(): Store<S>;

    /**
     * Renders the elements content into its shadow root using props from
     * {@ref getProps}.
     *
     * You probably want to use {@ref enqueueRender} instead.
     */
    render();

    /**
     * Callback that computes the view properties from the redux store
     * and the props passed to the component.
     *
     * @param {OP} ownProps Props passed to the component via attributes.
     * @returns {P} Generated view properties.
     */
    getProps(ownProps?: OP): P;
}

/* tslint:disable:max-line-length */

/**
 * Creates a 💪 web component connected to the redux store.
 *
 * @param {MapStateToPropsFn<S, SP, OP>} mapStateToProps The MapStateToProps function. If you want to use ownProps, pass the return value through the {@link withProps} mixin.
 * @param {MapDispatchToPropsFn<S, DP, OP>} mapDispatchToProps The MapStateToDispatch function. If you want to use ownProps, pass the return value through the {@link withProps} mixin.
 * @param {(props: (SP & DP)) => TemplateResult} templateFn The 🔥-html templating function.
 * @returns {FitElement<S, SP & DP, OP>} A newly created 💪-element class.
 * @template S, SP, DP, OP
 */
export default function connect<S, SP, DP, OP = {}>(
    mapStateToProps: MapStateToPropsFactory<S, SP, OP> | MapStateToPropsFn<S, SP, OP>,
    mapDispatchToProps: MapDispatchToPropsFn<S, DP, OP> | DP,
    templateFn: (props: SP & DP) => TemplateResult,
): ClassConstructor<FitElement<S, SP & DP, OP>> {
    return class extends HTMLElement {
        private _isConnected: boolean = false;
        private _nodeName: string = this.nodeName.toLowerCase();
        private _preparedDispatch: MapDispatchToPropsFn<S, DP, OP> | ActionCreatorsMapObject;
        private _preparedMapStateToProps: MapStateToPropsFn<S, SP, OP>;
        private _previousProps: SP & DP | null = null;
        private _renderEnqueued: boolean = false;
        private _store: Store<S>;
        private _unsubscribe: Unsubscribe;

        constructor() {
            super();

            this.attachShadow({ mode: 'open' });

            this._preparedMapStateToProps = isFactory(mapStateToProps)
                ? mapStateToProps()
                : mapStateToProps;
        }

        connectedCallback() {
            this._isConnected = true;

            const store = this.getStore();
            this._preparedDispatch = isFunction(mapDispatchToProps)
                ? mapDispatchToProps
                : bindActionCreators(mapDispatchToProps as any as ActionCreatorsMapObject, store.dispatch);
            this._unsubscribe = store.subscribe(() => this.enqueueRender());

            this.enqueueRender();
        }

        disconnectedCallback() {
            this._isConnected = false;

            this._unsubscribe();
            this._store = undefined!;
        }

        enqueueRender() {
            if (this._renderEnqueued) {
                return;
            }

            this._renderEnqueued = true;
            Promise.resolve().then(() => {
                this._renderEnqueued = false;
                if (this._isConnected) {
                    this.render();
                }
            });
        }

        getStore(): Store<S> {
            if (this._store) {
                return this._store;
            }

            let node: any = this;
            while (node = node.parentNode || node.host) {
                if (isFunction(node.getStore)) {
                    this._store = node.getStore();
                    return this._store;
                }
            }

            throw new Error("💪-html: Missing redux store.\nSeems like you're using fit-html without a redux store. Please use a provider component to provide one to the element tree.");
        }

        getProps(ownProps = {} as OP): SP & DP {
            const store = this.getStore();
            return Object.assign(
                {},
                this._preparedMapStateToProps(store.getState(), ownProps),
                isFunction(this._preparedDispatch)
                    ? this._preparedDispatch(store.dispatch, ownProps)
                    : this._preparedDispatch,
            ) as SP & DP;
        }

        render() {
            if (!this._isConnected) {
                return;
            }

            const props = this.getProps();

            if (shallowEqual(props, this._previousProps)) {
                return;
            }

            this._previousProps = props;
            window.ShadyCSS
                ? shadyRender(templateFn(props), this.shadowRoot!, this._nodeName)
                : render(templateFn(props), this.shadowRoot!);
        }
    };
}

function isFactory<S, P, OP>(
    fn: MapStateToPropsFactory<S, P, OP> | MapStateToPropsFn<S, P, OP>,
): fn is MapStateToPropsFactory<S, P, OP> {
    return fn.length === 0;
}

// tslint:disable-next-line:ban-types
function isFunction(f: any): f is Function {
    return typeof f === 'function';
}

function shallowEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
        return false;
    }

    for (const key of aKeys) {
        if (a[key] !== b[key]) {
            return false;
        }
    }

    return true;
}
