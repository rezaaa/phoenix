import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import Loadable from "react-loadable";
import App from "../app";
import { Provider } from "react-redux";
import createStore from "../store";
import { createUser } from "../modules/membership";
import rootSaga from "../code/redux/root_saga";
import isProduction from "../modules/utils/is_production";

const root = document.querySelector("#root");

// get initial state from server and use it for creating redux store
const store = createStore({ initState: window.__SERVER_STATES__ || {} });

const theUser = createUser({ initContext: window.__CONTEXT__ || null });

// we need to start sagas outside the Redux middleware environment
// because of running necessary sagas for pre-fetching data for server side rendering on server app
store.runSaga(rootSaga);

// in development mode we are not using server side rendering
// because using ReactDom.hydrate generates a different DOM from what we produced in our SSR,
// thus react gives us a warning because of that.
const renderMethod = isProduction ? ReactDOM.hydrate : ReactDOM.render;
theUser.getUser().then(user => {
  Loadable.preloadReady().then(() => {
    renderMethod(
      <Provider store={store}>
        <BrowserRouter>
          <App user={user.data} />
        </BrowserRouter>
      </Provider>,
      root
    );
  });
});
