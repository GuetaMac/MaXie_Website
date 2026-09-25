import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./index.css";

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    // check for updates every time the app comes back to foreground
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        registration?.update();
      }
    });
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
