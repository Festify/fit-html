import camelize from 'lodash-es/camelCase';
import kebapize from 'lodash-es/kebabCase';

import { FitElement } from './connect';

/**
 * Attribute observer configuration with *camelized* attribute names.
 */
export interface AttributeDescriptors {
    [key: string]: typeof String | typeof Number | typeof Boolean | typeof Object;
}

export type AttributeValues<A> = {
    [key in keyof A]: string | number | boolean | object;
};

/**
 * Wraps the given 💪-element to react to attribute and property changes.
 *
 * Use this if you want to make use of props passed to you from the outside.
 * Without this mixin, the ownProps parameters from mapStateToProps and
 * mapDispatchToProps will just be empty objects.
 *
 * @param {FitElement<S, P, OP>} Base The base 💪-element.
 * @param {A} attributeDescriptors Attribute descriptors (with camelized attribute names) describing which attributes and properties to listen for changes on.
 * @returns {FitElement<S, P, A>} A subclass of the given {@link Base} that listens for changes on the given properties and attributes.
 * @template S, P, A, OP
 */
export default function withProps<S, P, A extends AttributeDescriptors>(
    Base: FitElement<S, P, AttributeValues<A>>,
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
                    configurable: true,
                    enumerable: true,
                    get: () => this._ownProps[propName],
                    set: val => {
                        if (this._ownProps[propName] === val) {
                            return;
                        }

                        this._ownProps[propName] = val;
                        this.enqueueRender();
                    }
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

            let value;
            if (type === Boolean) {
                value = newValue !== null;
            } else if (type === Number) {
                value = Number(newValue);
            } else if (type === String) {
                value = String(newValue);
            } else {
                value = newValue;
            }

            this[realName] = value;
        }

        getProps(): P {
            return super.getProps(this._ownProps);
        }
    };
}
