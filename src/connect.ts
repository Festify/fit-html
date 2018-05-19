import { bindActionCreators, ActionCreatorsMapObject, Dispatch, Store, Unsubscribe } from 'redux';

import { ClassConstructor } from '.';
import withFit, { FitDecorated, TemplateFunction } from './fit-element';
import { isFunction } from './util';

/**
 * The function that extracts required data out of the state and the passed props.
 */
export type MapStateToPropsFn<S, P, OP> = (state: S, ownProps: OP) => P;

/**
 * The function that sets up the view actions based on the store's dispatch function.
 */
export type MapDispatchToPropsFn<P, OP> = (dispatch: Dispatch, ownProps: OP) => P;

/**
 * A factory method for creating a specialized {@ref MapStateToPropsFn<S, P, OP>}
 * for every instance of the component.
 *
 * Will be invoked at component construction time.
 */
export type MapStateToPropsFactory<S, P, OP> = () => MapStateToPropsFn<S, P, OP>;

/**
 * An element connected to the redux store.
 */
export interface ConnectElement<S> {
    getStore(): Store<S>;
}

/*
 * A 💪-html element that is connected to the redux store.
 */
export type ConnectedElement<
    S, SP, DP, OP,
    B extends ClassConstructor<HTMLElement>,
    T extends FitDecorated<B, OP, SP & DP>
>
    = T & ClassConstructor<ConnectElement<S>>;

/**
 * The type of decorator wrapping a templating function.
 */
export type TemplateDecorator<S, SP, DP, OP> = (fn: TemplateFunction<SP & DP>) => ConnectedElement<
    S, SP, DP, OP,
    typeof HTMLElement,
    FitDecorated<typeof HTMLElement, OP, SP & DP>
>;

/**
 * The type of decorator wrapping a connected element.
 */
export type ElementDecorator<S, SP, DP, OP> = <
    B extends ClassConstructor<HTMLElement>,
    T extends FitDecorated<B, OP, SP & DP>
>(base: T) => ConnectedElement<S, SP, DP, OP, B, T>;

/* tslint:disable:max-line-length */

/**
 * Creates a decorator to create 💪 web components using the given template function / base class.
 *
 * @param {MapStateToPropsFn<S, SP, OP>} mapStateToProps The MapStateToProps function or factory.
 * @param {MapDispatchToPropsFn<DP, OP>} mapDispatchToProps The MapStateToDispatch function.
 * @returns The decorator function.
 * @template S, SP, DP, OP
 */
export default function connect<S, SP, DP, OP = {}>(
    mapStateToProps: MapStateToPropsFactory<S, SP, OP> | MapStateToPropsFn<S, SP, OP>,
    mapDispatchToProps: MapDispatchToPropsFn<DP, OP> | DP,
): TemplateDecorator<S, SP, DP, OP> & ElementDecorator<S, SP, DP, OP>;

// We declare the exported typings separately for now (above).

export default function connect<S, SP, DP, OP = {}>(
    mapStateToProps: MapStateToPropsFactory<S, SP, OP> | MapStateToPropsFn<S, SP, OP>,
    mapDispatchToProps: MapDispatchToPropsFn<DP, OP> | DP,
) {
    return <
        B extends ClassConstructor<HTMLElement>,
        T extends FitDecorated<B, OP, SP & DP>,
    >(b: T | TemplateFunction<SP & DP>) => {
        const base: ClassConstructor<any> = isTemplateFunction(b) ? withFit(b)(HTMLElement) : b;

        return class extends base {
            _propsEnqueued: boolean = false;
            _ownProps: OP;
            _preparedDispatch: MapDispatchToPropsFn<DP, OP> | ActionCreatorsMapObject;
            _preparedMapStateToProps: MapStateToPropsFn<S, SP, OP>;
            _store: Store<S>;
            _unsubscribe: Unsubscribe;

            get ownProps() {
                return this._ownProps;
            }

            set ownProps(props: OP) {
                this._ownProps = props;
                this._computeProps();
            }

            constructor(...args: any[]) {
                super(...args);

                this._preparedMapStateToProps = isFactory(mapStateToProps)
                    ? mapStateToProps()
                    : mapStateToProps;
            }

            connectedCallback() {
                super.connectedCallback(false);

                const store = this.getStore();
                this._preparedDispatch = isFunction(mapDispatchToProps)
                    ? mapDispatchToProps
                    : bindActionCreators(mapDispatchToProps as any as ActionCreatorsMapObject, store.dispatch);
                this._unsubscribe = store.subscribe(() => this._computeProps());

                this._computeProps();
            }

            disconnectedCallback() {
                super.disconnectedCallback();

                this._unsubscribe();
                this._store = undefined!;
            }

            getStore(): Store<S> {
                if (this._store) {
                    return this._store;
                }
                if (isFunction(super.getStore)) {
                    return super.getStore();
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

            _computeProps() {
                if (this._propsEnqueued) {
                    return;
                }

                this._propsEnqueued = true;
                Promise.resolve().then(() => {
                    this._propsEnqueued = false;

                    const store = this.getStore();
                    const props = this._preparedMapStateToProps(store.getState(), this.ownProps);
                    const dispatch = isFunction(this._preparedDispatch)
                        ? this._preparedDispatch(store.dispatch, this.ownProps)
                        : this._preparedDispatch;

                    this.renderProps = Object.assign({}, props, dispatch) as SP & DP;
                });
            }
        };
    };
}

/* tslint:enable */

function isFactory<S, P, OP>(
    fn: MapStateToPropsFactory<S, P, OP> | MapStateToPropsFn<S, P, OP>,
): fn is MapStateToPropsFactory<S, P, OP> {
    return fn.length === 0;
}

function isTemplateFunction<
    B extends ClassConstructor<HTMLElement>,
    T extends FitDecorated<B, OP, SP & DP>,
    OP,
    SP,
    DP
>(
    base: T | TemplateFunction<SP & DP>,
): base is TemplateFunction<SP & DP> {
    return !(base.prototype instanceof HTMLElement);
}
