import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../reducers/root.js";
import profileReducer from "./profile.js";
import globalReducer from "./global.js";

export default function configure(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}
