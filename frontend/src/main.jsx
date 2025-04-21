import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import configureStore from './store/store';
import { Provider } from "react-redux";
import "./styles/index.css";
import { BrowserRouter } from "react-router-dom";
import rootReducer from "./reducers/root.js"
// import { checkLoggedIn } from "./util/session";

// <-- REMOVE IN PRODUCTION 
const isBypassAuth = import.meta.env.VITE_BYPASS_AUTH;
const mockSession = {
    userId: "123",
    username: "DevUser",
};

const mockState = (isBypassAuth === "true") ? {session : mockSession} : undefined;

const store = configureStore(mockState);
console.log(isBypassAuth);
console.log(store.getState());
// -->


ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
);

// <-- REMOVE IN PRODUCTION
window.getState = store.getState;
//  -->