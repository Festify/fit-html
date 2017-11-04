import { html, render, TemplateResult } from 'lit-html';
import { Dispatch, Store, Unsubscribe } from 'redux';

import { ProviderElement } from './provider';

export interface MapStateToPropsFn<S, P, OP> {
    (state: S, ownProps: OP): P;
}

export interface MapDispatchToProps<S, P, OP> {
    (dispatch: Dispatch<S>, ownProps: OP): P;
}

/**
 * A 💪 web component.
 *
 * @template {S} The type of the redux state.
 * @template {P} The type of the view properties.
 * @template {OP} The type of the own properties passed to the element from the outside.
 */
export interface FitElement<S, P, OP> extends HTMLElement {
    new(...args: any[]): FitElement<S, P, OP>;

    /**
     * The 🔥-html templating function.
     *
     * @param {P} props View properties.
     * @returns {TemplateResult} The 🔥-html template result.
     */
    templateFunction: (props: P) => TemplateResult;

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
}

export { html };

/**
 * Creates a 💪 web component connected to the redux store.
 *
 * @param {MapStateToPropsFn<S, SP, OP>} mapStateToProps The MapStateToProps function. If you want to use ownProps, pass the return value through the {@link withProps} mixin.
 * @param {MapDispatchToProps<S, DP, OP>} mapDispatchToProps The MapStateToDispatch function. If you want to use ownProps, pass the return value through the {@link withProps} mixin.
 * @param {(props: (SP & DP)) => TemplateResult} templateFn The 🔥-html templating function.
 * @returns {FitElement<S, SP & DP, OP>} A newly created 💪-element.
 * @template S, SP, DP, OP
 */
export default function connect<S, SP, DP, OP = {}>(
    mapStateToProps: MapStateToPropsFn<S, SP, OP>,
    mapDispatchToProps: MapDispatchToProps<S, DP, OP>,
    templateFn: (props: SP & DP) => TemplateResult
): FitElement<S, SP & DP, OP> {
    return class extends HTMLElement {
        _renderEnqueued: boolean = false;
        _store: Store<S>;
        _unsubscribe: Unsubscribe;

        get templateFunction(): (props: SP & DP) => TemplateResult {
            return templateFn;
        }

        connectedCallback() {
            this.attachShadow({ mode: 'open' });

            const store = this.getStore();
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
                mapStateToProps(store.getState(), ownProps),
                mapDispatchToProps(store.dispatch, ownProps)
            ) as SP & DP;
        }

        render() {
            render(templateFn(this.getProps()), this.shadowRoot!);
        }
    } as any;
}
