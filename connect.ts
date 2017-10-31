import { TemplateResult } from 'lit-html';
import { render } from 'lit-html';
import { Dispatch, Store, Unsubscribe } from 'redux';

import { ProviderElement } from './provider.js';

export interface MapStateToPropsFn<S, P> {
    (state: S): Partial<P>;
}

export interface MapDispatchToProps<S, P> {
    (dispatch: Dispatch<S>): Partial<P>;
}

export interface Renderer<P> {
    (props: P): TemplateResult;
}

export interface FitElement<S, P> extends HTMLElement {
    enqueueRender(): void;
    getStore(): Store<S>;
}

function isProvider<S>(elem: HTMLElement): elem is ProviderElement<S> {
    return !!(elem as any).reduxStore;
}

export default function connect<S, P>(
    mapStateToProps: MapStateToPropsFn<S, P>,
    mapDispatchToProps: MapDispatchToProps<S, P>,
    renderer: Renderer<P>
): FitElement<S, P> {
    return class extends HTMLElement {
        _dispatch: Partial<P>;
        _renderEnqueued: boolean = false;
        _store: Store<S>;
        _unsubscribe: Unsubscribe;

        connectedCallback() {
            this.attachShadow({ mode: 'open' });

            const store = this.getStore();
            this._dispatch = mapDispatchToProps(store.dispatch);
            this._unsubscribe = store.subscribe(this.enqueueRender);
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
                    this._render();
                });
        }

        getStore(): Store<S> {
            if (this._store) {
                return this._store;
            }

            let node: HTMLElement | null = this;
            while (node = node.parentElement) {
                if (isProvider<S>(node)) {
                    this._store = node.reduxStore;
                    return this._store;
                }
            }

            throw new Error("Missing redux store.\nSeems like you're using fit-html without a redux store. Please use the provider component to provide one to the element tree.");
        }

        _render() {
            const props = Object.assign(
                {},
                mapStateToProps(this.getStore().getState()),
                this._dispatch
            ) as P;

            render(renderer(props), this.shadowRoot!);
        }
    } as any;
}