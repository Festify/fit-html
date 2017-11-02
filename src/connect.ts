import { html, render, TemplateResult } from 'lit-html';
import { Dispatch, Store, Unsubscribe } from 'redux';

import { ProviderElement } from './provider';

export interface MapStateToPropsFn<S, P, OP> {
    (state: S, ownProps: OP): P;
}

export interface MapDispatchToProps<S, P, OP> {
    (dispatch: Dispatch<S>, ownProps: OP): P;
}

export interface FitElement<S, P, OP> extends HTMLElement {
    new(...args: any[]): FitElement<S, P, OP>;

    templateFunction: (props: P) => TemplateResult;

    enqueueRender();
    getStore(): Store<S>;
    getProps(ownProps?: OP): P;
    render();
}

export { html };

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
