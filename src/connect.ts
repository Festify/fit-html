import { bindActionCreators, ActionCreatorsMapObject, Dispatch, Store, Unsubscribe } from 'redux';

import { ClassConstructor } from '.';
import withFit, { FitElementConstructor, TemplateFunction } from './fit-element';

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

/* tslint:disable:max-line-length */

/**
 * Creates a subclass of the given 💪 web component connected to the redux store.
 *
 * @param {MapStateToPropsFn<S, SP, OP>} mapStateToProps The MapStateToProps function or factory.
 * @param {MapDispatchToPropsFn<S, DP, OP>} mapDispatchToProps The MapStateToDispatch function.
 * @returns {<B extends <HTMLElement>, T extends FitElementConstructor<B, OP, SP & DP>>(base: (TemplateFunction<SP & DP> | T)) => {new(...args: any[]): {_ownProps: OP; _preparedDispatch: MapDispatchToPropsFn<S, DP, OP> | ActionCreatorsMapObject; _preparedMapStateToProps: MapStateToPropsFn<S, SP, OP>; _store: Store<S>; _unsubscribe: Unsubscribe; ownProps: any; connectedCallback(): void; disconnectedCallback(): void; getStore(): Store<S>; _computeProps(): void}}} The actual decorator function.
 * @template S, SP, DP, OP
 */
export default function connect<S, SP, DP, OP = {}>(
    mapStateToProps: MapStateToPropsFactory<S, SP, OP> | MapStateToPropsFn<S, SP, OP>,
    mapDispatchToProps: MapDispatchToPropsFn<S, DP, OP> | DP,
) {
    return <B extends ClassConstructor<HTMLElement>, T extends FitElementConstructor<B, OP, SP & DP>>(
        base: T | TemplateFunction<SP & DP>,
    ) => {
        const clazz: FitElementConstructor<ClassConstructor<HTMLElement>, OP, SP & DP> = isBaseClass(base)
            ? base
            : withFit<OP, SP & DP>(base)(HTMLElement);

        return class extends clazz {
            _ownProps: OP;
            _preparedDispatch: MapDispatchToPropsFn<S, DP, OP> | ActionCreatorsMapObject;
            _preparedMapStateToProps: MapStateToPropsFn<S, SP, OP>;
            _store: Store<S>;
            _unsubscribe: Unsubscribe;

            get ownProps() {
                return super.ownProps;
            }

            set ownProps(props: OP) {
                super.ownProps = props;
                this._computeProps();
            }

            constructor(...args: any[]) {
                super(...args);

                this._preparedMapStateToProps = isFactory(mapStateToProps)
                    ? mapStateToProps()
                    : mapStateToProps;
            }

            connectedCallback() {
                super.connectedCallback();

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
                const store = this.getStore();
                this.renderProps = Object.assign(
                    {},
                    this._preparedMapStateToProps(store.getState(), this.ownProps),
                    isFunction(this._preparedDispatch)
                        ? this._preparedDispatch(store.dispatch, this.ownProps)
                        : this._preparedDispatch,
                ) as SP & DP;
            }
        };
    };
}

/* tslint:enable */

function isBaseClass<
    B extends ClassConstructor<HTMLElement>,
    T extends FitElementConstructor<B, OP, SP & DP>,
    OP,
    SP,
    DP
>(
    base: T | TemplateFunction<SP & DP>,
): base is T {
    return base.prototype instanceof HTMLElement;
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
