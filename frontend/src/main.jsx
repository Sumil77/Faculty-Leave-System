import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import configureStore from './store/store';
import { Provider } from "react-redux";
import "./styles/index.css";
import { BrowserRouter } from "react-router-dom";
import combineReducers from "./reducers/root.js"
// import { checkLoggedIn } from "./util/session";
const isBypassAuth = import.meta.env.VITE_BYPASS_AUTH;

const mockSession = {
    userId: "mock123",
    username: "DevUser",
};

const store = configureStore(isBypassAuth ? undefined: {session : mockSession});

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
);
window.getState = store.getState;