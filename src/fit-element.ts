import { render, TemplateResult } from 'lit-html';
import { render as shadyRender } from 'lit-html/lib/shady-render';

import { ClassConstructor } from '.';

declare interface Window {
    ShadyCSS?: any;
}

/**
 * A lit-html rendering function.
 */
export type RenderFunction<P> = (props: P) => TemplateResult;

/**
 * A value constructor.
 */
export type Transformer = (value: string) => any;

/**
 * Attribute observer configuration.
 *
 * If a constructor function is present, it will be invoked when an
 * attribute changes with the attribute's new value. If null is passed
 * or a property is set the value will be left untouched.
 */
export type AttributeDescriptors<OP> = {
    [key in keyof OP]: Transformer | null;
};

export declare class FitElementBase<OP, RP> extends HTMLElement {
    ownProps: OP;
    renderProps: RP;
    readonly template: RenderFunction<RP>;

    constructor(...args: any[]);

    attributeChangedCallback(name: string, oldValue: string, newValue: string);
    connectedCallback();
    disconnectedCallback();
    enqueueRender();
    render();
}

export type FitElementConstructor<T extends ClassConstructor<HTMLElement>, OP, RP> =
    T & ClassConstructor<FitElementBase<OP, RP>>;

export default function withFit<RP>(rndr: RenderFunction<RP>) {
    return <T extends ClassConstructor<HTMLElement>, OP = RP>(base: T) => {
        const Element = class extends base {
            _isConnected = false;
            _nodeName = this.nodeName.toLowerCase();
            _renderEnqueued = false;
            _renderProps: RP;

            static get observedAttributes(): string[] {
                return Object.keys(this.properties);
            }

            static get properties(): AttributeDescriptors<OP> {
                return {} as AttributeDescriptors<OP>;
            }

            get ownProps(): OP {
                return this.renderProps as any;
            }

            set ownProps(props: OP) {
                this.renderProps = props as any;
            }

            get renderProps(): RP {
                return this._renderProps;
            }

            set renderProps(props: RP) {
                if (shallowEqual(props, this._renderProps)) {
                    return;
                }

                this._renderProps = props;
                this.enqueueRender();
            }

            get template(): RenderFunction<RP> {
                return rndr;
            }

            constructor(...args: any[]) {
                super(...args);

                for (const propName of Element.observedAttributes) {
                    Object.defineProperty(this, propName, {
                        configurable: true,
                        enumerable: true,
                        get: () => this.ownProps[propName],
                        set: val => {
                            if (this[propName] === val) {
                                return;
                            }

                            this.ownProps = {
                                ...(this.ownProps as any),
                                [propName]: val,
                            };
                        },
                    });
                }

                this.attachShadow({ mode: 'open' });
            }

            attributeChangedCallback(name: string, oldValue: string, newValue: string) {
                if (!(name in Element.properties) || oldValue === newValue) {
                    return;
                }

                const transformer = Element.properties[name];
                if (!transformer) {
                    this[name] = newValue;
                } else if (transformer === Boolean) {
                    // tslint:disable-next-line:triple-equals
                    this[name] = newValue != null;
                } else {
                    this[name] = transformer(newValue);
                }
            }

            connectedCallback() {
                this._isConnected = true;
                this.enqueueRender();
            }

            disconnectedCallback() {
                this._isConnected = false;
            }

            enqueueRender() {
                if (this._renderEnqueued) {
                    return;
                }

                this._renderEnqueued = true;
                Promise.resolve().then(() => {
                    this._renderEnqueued = false;
                    if (!this._isConnected) {
                        this.render();
                    }
                });
            }

            render() {
                if (!this._isConnected) {
                    return;
                }

                window.ShadyCSS
                    ? shadyRender(this.template(this.renderProps), this.shadowRoot!, this._nodeName)
                    : render(this.template(this.renderProps), this.shadowRoot!);
            }
        };

        return Element;
    };
}

function shallowEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
        return false;
    }

    for (const key of aKeys) {
        if (a[key] !== b[key]) {
            return false;
        }
    }

    return true;
}
