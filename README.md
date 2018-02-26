# 💪 fit-html

[![Travis](https://img.shields.io/travis/Festify/fit-html.svg)](https://travis-ci.org/Festify/fit-html)
[![Bundle Size](http://img.badgesize.io/https://unpkg.com/fit-html/.tmp/index.min.js?compression=gzip)](https://www.npmjs.com/package/fit-html)
[![Greenkeeper badge](https://badges.greenkeeper.io/Festify/fit-html.svg)](https://greenkeeper.io/)

3KB web components + lit-html + redux library without bloat.

## Overview

fit-html is a combination of [lit-html](https://github.com/Polymer/lit-html), web components and [redux](http://redux.js.org/) bringing efficient rendering and a functional application architecture together. Yet, the total size of the framework is below 3KB, including dependencies.

## Small Example

You need the following:
```js
import { connect, createProvider, withExtended } from 'fit-html';
import { html } from 'lit-html/lib/lit-extended';
import { createStore } from 'redux';
```

Set up redux store:
```js
const todos = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return state.concat([action.text]);
    default:
      return state;
  }
};

const store = createStore(todos, ['Use Redux']);
```

Set up redux provider element (this must be at the root of your element tree):
```js
const provider = createProvider(store);
customElements.define('redux-provider', provider);
```

Define actions and view:
```js
function addTodo() {
  return {
    type: 'ADD_TODO',
    text: `Hello ${Math.random()}`
  };
}

const render = ({ addTodo, todos }) => html`
  <ul>
    ${todos.map(text => html`<li>${text}</li>`)}
  </ul>

  <button on-click="${addTodo}">
    Add
  </button>
`;

const TodosApp = connect(
  state => ({ todos: state }),
  { addTodo },
  render
);

customElements.define('todo-app', TodosApp);
```

`index.html`:
```html
<html>
  <head>
    <title>My cool 💪-html app</title>
  </head>
  <body>
    <redux-provider>
      <todo-app></todo-app>
    </redux-provider>
  </body>
</html>
```

Please see https://github.com/Festify/fit-html-demo for more and larger examples.

## Compatibility

💪-html is written for use with evergreen browsers. Not so much for Internet Explorer (though we strive to become compatible with IE11 once lit-html itself is).

## License

MIT
