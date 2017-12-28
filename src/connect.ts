import { html, render, TemplateResult } from 'lit-html';
import isFunction from 'lodash-es/isFunction';
import { bindActionCreators, ActionCreatorsMapObject, Dispatch, Store, Unsubscribe } from 'redux';

import { ProviderElement } from './provider';

export interface MapStateToPropsFn<S, P, OP> {
    (state: S, ownProps: OP): P;
}

export interface MapDispatchToPropsFn<S, P, OP> {
    (dispatch: Dispatch<S>, ownProps: OP): P;
}

export interface MapStateToPropsFactory<S, P, OP> {
    (): MapStateToPropsFn<S, P, OP>
}

/**
 * A 💪 web component.
 *
 * @template {S} The type of the redux state.
 * @template {P} The type of the view properties.
 * @template {OP} The type of the own properties passed to the element from the outside.
 */
export interface FitElement<S, P, OP> extends HTMLElement {
    /**
     * @hidden
     */
    _previousProps: P | null

    new(...args: any[]): FitElement<S, P, OP>;

    /**
     * The 🔥-html templating function.
     *
     * @param {P} props View properties.
     * @returns {TemplateResult} The 🔥-html template result.
     */
    templateFunction: (props: P) => TemplateResult;

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
     * @returns {Store<S>} The redux store.
     */
    getStore(): Store<S>;

    /**
     * Callback that computes the view properties from the redux store
     * and the props passed to the component.
     *
     * @param {OP} ownProps Props passed to the component via attributes.
     * @returns {P} Generated view properties.
     */
    getProps(ownProps?: OP): P;

    /**
     * Renders the elements content into its shadow root using props from
     * {@ref getProps}.
     */
    render();

    /**
     * @hidden
     */
    _shallowEqual(a, b): boolean;
}

export { html };

/**
 * Creates a 💪 web component connected to the redux store.
 *
 * @param {MapStateToPropsFn<S, SP, OP>} mapStateToProps The MapStateToProps function. If you want to use ownProps, pass the return value through the {@link withProps} mixin.
 * @param {MapDispatchToPropsFn<S, DP, OP>} mapDispatchToProps The MapStateToDispatch function. If you want to use ownProps, pass the return value through the {@link withProps} mixin.
 * @param {(props: (SP & DP)) => TemplateResult} templateFn The 🔥-html templating function.
 * @returns {FitElement<S, SP & DP, OP>} A newly created 💪-element.
 * @template S, SP, DP, OP
 */
export default function connect<S, SP, DP, OP = {}>(
    mapStateToProps: MapStateToPropsFactory<S, SP, OP> | MapStateToPropsFn<S, SP, OP>,
    mapDispatchToProps: MapDispatchToPropsFn<S, DP, OP> | DP,
    templateFn: (props: SP & DP) => TemplateResult
): FitElement<S, SP & DP, OP> {
    return class extends HTMLElement {
        _preparedDispatch: MapDispatchToPropsFn<S, DP, OP> | ActionCreatorsMapObject;
        _preparedMapStateToProps: MapStateToPropsFn<S, SP, OP>;
        _previousProps: SP & DP | null = null;
        _renderEnqueued: boolean = false;
        _store: Store<S>;
        _unsubscribe: Unsubscribe;

        get templateFunction(): (props: SP & DP) => TemplateResult {
            return templateFn;
        }

        constructor() {
            super();

            this.attachShadow({ mode: 'open' });

            this._preparedMapStateToProps = isFactory(mapStateToProps)
                ? mapStateToProps()
                : mapStateToProps;
        }

        connectedCallback() {
            const store = this.getStore();
            this._preparedDispatch = isFunction(mapDispatchToProps)
                ? mapDispatchToProps
                : bindActionCreators(mapDispatchToProps as any as ActionCreatorsMapObject, store.dispatch);
            this._unsubscribe = store.subscribe(() => this.enqueueRender());

            this.enqueueRender();
        }

        disconnectedCallback() {
            this._unsubscribe();
        }

        enqueueRender() {
            if (this._renderEnqueued) {
                return;
            }

            this._renderEnqueued = true;
            Promise.resolve()
                .then(() => {
                    this._renderEnqueued = false;
                    this.render();
                });
        }

        getStore(): Store<S> {
            if (this._store) {
                return this._store;
            }

            function isProvider<S>(elem: any): elem is ProviderElement<S> {
                return elem && !!(elem as ProviderElement<S>).reduxStore;
            }

            function isReduxStore<S>(obj: any): obj is Store<S> {
                return obj && obj.getState && obj.dispatch && obj.subscribe && obj.replaceReducer;
            }

            let node: any = this;
            while (node = node.parentNode || node.host) {
                if (isProvider<S>(node)) {
                    this._store = node.reduxStore;
                    return this._store;
                } else if (isReduxStore<S>(node._store)) {
                    this._store = node._store;
                    return this._store;
                }
            }

            throw new Error("Missing redux store.\nSeems like you're using fit-html without a redux store. Please use the provider component to provide one to the element tree.");
        }

        getProps(ownProps = {} as OP): SP & DP {
            const store = this.getStore();
            return Object.assign(
                {},
                this._preparedMapStateToProps(store.getState(), ownProps),
                isFunction(this._preparedDispatch)
                    ? this._preparedDispatch(store.dispatch, ownProps)
                    : this._preparedDispatch
            ) as SP & DP;
        }

        render() {
            const props = this.getProps();

            if (this._shallowEqual(props, this._previousProps)) {
                return;
            }

            this._previousProps = props;
            render(templateFn(props), this.shadowRoot!);
        }

        _shallowEqual(a, b) {
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
    } as any;
}

function isFactory<S, P, OP>(
    fn: MapStateToPropsFactory<S, P, OP> | MapStateToPropsFn<S, P, OP>
): fn is MapStateToPropsFactory<S, P, OP> {
    return fn.length === 0;
}
