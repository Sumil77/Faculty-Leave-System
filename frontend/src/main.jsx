import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import configureStore from './store/store';
import { Provider } from "react-redux";
import "./styles/index.css";
import { BrowserRouter } from "react-router-dom";

// ✅ Start MSW in dev/mock mode
if (import.meta.env.VITE_USE_MSW === "true") {
  console.log("mockservicerunning");
  
  const { worker } = await import("./mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}

const store = configureStore();

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
);
