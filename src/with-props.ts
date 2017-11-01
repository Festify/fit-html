import camelize from 'lodash-es/camelCase';

import { FitElement, MapDispatchToProps, MapStateToPropsFn } from './connect.js';

export interface AttributeOptions {
    [key: string]: typeof String | typeof Boolean | typeof Number;
}

export type AttributeValues<A> = {
    [K in keyof A]: boolean | string | number;
};

export default function withProps<S, P, A extends AttributeOptions>(
    Base: FitElement<S, P, any>,
    observedAttributes: A
): FitElement<S, P, AttributeValues<A>> {
    return class extends Base {
        private _observedAttributes: A = observedAttributes;
        private _ownProps: AttributeValues<A> = {} as AttributeValues<A>;

        get observedAttributes(): string[] {
            return Object.keys(this._observedAttributes);
        }

        attributeChangedCallback(name: string, _: string, newValue: string) {
            const realName = camelize(name);
            if (!(realName in this._observedAttributes)) {
                return;
            }

            const type = this._observedAttributes[realName];
            const value = (type === Boolean)
                ? (newValue !== null)
                : this._observedAttributes[realName](newValue);

            if (value === this._ownProps[realName]) {
                return;
            }
            
            this._ownProps[realName] = value;
            this.enqueueRender();
        }

        getProps(): P {
            return super.getProps(this._ownProps);
        }
    };
}
