import { html, render } from 'lit-html/lib/lit-extended';

import { FitElement, MapDispatchToProps, MapStateToPropsFn } from './connect.js';

export { html };

export default function withExtended<S, P, OP>(Base: FitElement<S, P, OP>): FitElement<S, P, OP> {
    return class extends Base {
        render() {
            const props = this.getProps();
            render(this.templateFunction(props), this.shadowRoot!);
        }
    };
}
