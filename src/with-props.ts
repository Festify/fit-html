import { ClassConstructor } from '.';
import { FitElement } from './connect';

declare const process: any;

/**
 * A value constructor.
 */
export type Constructor = (value: string) => any;

/**
 * Attribute observer configuration.
 *
 * If a constructor function is present, it will be invoked when an
 * attribute changes with the attribute's new value. If null is passed
 * or a property is set the value will be left untouched.
 */
export interface AttributeDescriptors {
    [key: string]: Constructor | null;
}

/**
 * Attribute values with extracted property values.
 */
export type AttributeValues<A> = {
    [key in keyof A]: any;
};

/**
 * Wraps the given 💪-element to react to attribute and property changes.
 *
 * Use this if you want to make use of props passed to you from the outside.
 * Without this mixin, the ownProps parameters from mapStateToProps and
 * mapDispatchToProps will just be empty objects.
 *
 * @param {FitElement<S, P, OP>} Base The base 💪-element.
 * @param {A} attributeDescriptors Attribute descriptors describing which attributes and properties to listen for changes on.
 * @returns {FitElement<S, P, A>} A subclass of the given {@link Base} that listens for changes on the given properties and attributes.
 * @template S, P, A, OP
 */
export default function withProps<
    B extends ClassConstructor<FitElement<S, P, AttributeValues<A>>>,
    S,
    P,
    A extends AttributeDescriptors
>(Base: B, attributeDescriptors: A): B {
    if (process && process.env.NODE_ENV !== 'production') {
        const hasCasedAttrs = Object.keys(attributeDescriptors)
            .some(k => attributeDescriptors[k] !== null && /[A-Z]/.test(k));

        if (hasCasedAttrs) {
            console.warn("💪-html: DOM attribute changes cannot be detected for property names with uppercase letters. Use lowercase property names to fix this.");
        }
    }

    const observedAttrs = Object.keys(attributeDescriptors);

    return class extends Base {
        private _ownProps: AttributeValues<A> = {} as AttributeValues<A>;

        static get observedAttributes(): string[] {
            return observedAttrs;
        }

        constructor(...args: any[]) {
            super(args);

            const obj = {};
            for (const propName of observedAttrs) {
                obj[propName] = {
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
            if (!(name in attributeDescriptors)) {
                return;
            }

            const type = attributeDescriptors[name];

            if (!type) {
                this[name] = newValue;
            } else if (type === Boolean) {
                this[name] = newValue !== null;
            } else {
                this[name] = type(newValue);
            }
        }

        getProps(): P {
            return super.getProps(this._ownProps);
        }
    };
}
