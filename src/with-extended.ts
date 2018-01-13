import { html, render } from 'lit-html/lib/lit-extended';

import { ClassConstructor } from '.';
import { FitElement } from './connect';

export { html };

/**
 * Wraps the given 💪-element to use lit-extended's render function.
 *
 * Use this if you want to attach event-handlers to your children, for example.
 *
 * @param {FitElement<S, P, OP>} Base The base 💪-element.
 * @returns {FitElement<S, P, OP>} A subclass of the given {@ref Base} that uses lit-extendeds rendering.
 * @template S, P, OP
 */
export default function withExtended<
    B extends ClassConstructor<FitElement<S, P, OP>>,
    S,
    P,
    OP
>(Base: B): B {
    return class extends Base {
        get renderFunction() {
            return render;
        }
    };
}
