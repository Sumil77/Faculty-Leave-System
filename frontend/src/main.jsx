import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import configureStore from './store/store';
import { Provider } from "react-redux";
import "./styles/index.css";
import { BrowserRouter } from "react-router-dom";
import { checkLoggedIn } from "./util/session";

const renderApp = preloadedState => {
  const store = configureStore(preloadedState);
  ReactDOM.createRoot(document.getElementById("root")).render(
    <Provider store={store}>
        <App />
    </Provider>,
  );
};
(async () => renderApp(await checkLoggedIn()))();