// store.js
import { configureStore } from "@reduxjs/toolkit";
import reducer from "../reducers/root.js";

export default preloadedState =>
  configureStore({
    reducer,
    preloadedState,
  });