import camelize from 'lodash-es/camelCase';
import kebapize from 'lodash-es/kebabCase';

import { FitElement } from './connect';

export interface AttributeDescriptors {
    [key: string]: typeof String | typeof Boolean | typeof Number;
}

export type AttributeValues<A> = {
    [K in keyof A]: boolean | string | number;
};

export default function withProps<S, P, A extends AttributeDescriptors>(
    Base: FitElement<S, P, any>,
    attributeDescriptors: A
): FitElement<S, P, AttributeValues<A>> {
    const observedAttrs = Object.keys(attributeDescriptors).map(kebapize);

    return class extends Base {
        private _attributeDescriptors: A = attributeDescriptors;
        private _ownProps: AttributeValues<A> = {} as AttributeValues<A>;

        static get observedAttributes(): string[] {
            return observedAttrs;
        }

        constructor() {
            super();

            const obj = {};
            for (const propName of observedAttrs) {
                obj[propName] = obj[camelize(propName)] = {
                    get: () => this._ownProps[propName],
                    set: val => this._ownProps[propName] = val
                };
            }

            Object.defineProperties(this, obj);
        }

        attributeChangedCallback(name: string, _: string, newValue: string) {
            if (observedAttrs.indexOf(name) === -1) {
                return;
            }

            const realName = camelize(name);
            const type = this._attributeDescriptors[realName];
            const value = (type === Boolean)
                ? (newValue !== null)
                : this._attributeDescriptors[realName](newValue);

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
