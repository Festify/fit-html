/* tslint:disable:only-arrow-functions */

import { html } from 'lit-html';
import { createStore, Store } from 'redux';

import connect from '../src/connect.js';
import createProvider from '../src/provider.js';

let providerIndex = 0;
function setupProvider(): [Store<void>, HTMLElement] {
    const store = createStore(() => {});

    const provider = createProvider(store);
    const name = 'connect-redux-provider-' + providerIndex++;
    customElements.define(name, provider);

    const providerElement = document.createElement(name);
    document.body.appendChild(providerElement);

    return [store, providerElement];
}

describe('connect', () => {
    it('should render only once per microtask', async () => {
        let counter = 0;
        customElements.define('render-once-microtask', connect(
            () => { counter++; },
            {},
            () => html``,
        ));

        const [store, el] = setupProvider();
        el.appendChild(document.createElement('render-once-microtask'));

        const a = { type: 'TEST' };
        store.dispatch(a);
        store.dispatch(a);

        await false;

        assert.equal(counter, 1);
    });
});
