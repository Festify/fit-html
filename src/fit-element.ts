import { TemplateResult } from 'lit-html';
import { render as shadyRender } from 'lit-html/lib/shady-render';

import { ClassConstructor } from '.';
import { shallowEqual } from './util';

declare interface Window {
    ShadyCSS?: any;
}

/**
 * A lit-html template construction function.
 */
export type TemplateFunction<P> = (props: P) => TemplateResult;

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

/**
 * A 💪-html decorated class.
 */
export type FitDecorated<B extends ClassConstructor<HTMLElement>, OP, RP> =
    B & FitElementConstructor<OP, RP>;

/**
 * A 💪-html decorated element.
 */
export interface FitElement<OP, RP> {
    ownProps: OP;
    renderProps: RP;
    template: TemplateFunction<RP>;

    attributeChangedCallback(name: string, oldValue: string, newValue: string);
    connectedCallback();
    disconnectedCallback();
    enqueueRender();
    render();
}

/**
 * The constructor for a 💪-html element.
 */
export interface FitElementConstructor<OP, RP> {
    observedAttributes: string[];
    properties: AttributeDescriptors<OP>;

    new(...args: any[]): FitElement<OP, RP>;
}

/* tslint:disable:max-line-length */

/**
 * Creates a subclass of the given HTML element that uses lit-html rendering and listens
 * for attribute and property changes.
 *
 * @param {TemplateFunction<RP>} templ The lit-html templating function.
 * @param {AttributeDescriptors<OP>} desc Property descriptors to enable the attribute & property listening.
 * @returns The decorator function.
 * @template OP, RP
 */
export default function withFit<OP, RP = OP>(templ: TemplateFunction<RP>, desc?: AttributeDescriptors<OP>) {
    return <T extends ClassConstructor<HTMLElement>>(base: T): FitDecorated<T, OP, RP> => {
        const Element = class extends base {
            _isConnected = false;
            _nodeName = this.nodeName.toLowerCase();
            _renderEnqueued = false;
            _renderProps: RP;

            static get observedAttributes(): string[] {
                return Object.keys(this.properties);
            }

            static get properties(): AttributeDescriptors<OP> {
                return desc || {} as AttributeDescriptors<OP>;
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

            get template(): TemplateFunction<RP> {
                return templ;
            }

            constructor(...args: any[]) {
                super(...args);

                for (const propName of Element.observedAttributes) {
                    Object.defineProperty(this, propName, {
                        configurable: true,
                        enumerable: true,
                        get: () => this.ownProps
                            ? this.ownProps[propName]
                            : undefined,
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
                if (window.ShadyCSS) {
                    window.ShadyCSS.styleElement(this);
                }

                this._isConnected = true;
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

                shadyRender(this.template(this.renderProps), this.shadowRoot!, this._nodeName);
            }
        };

        return Element;
    };
}

/* tslint:enable */
