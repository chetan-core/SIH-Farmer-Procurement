import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import "./index.css";
import { LanguageProvider } from "./translations/LanguageContext";
import SmoothScroll from "./components/SmoothScroll";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>

    <BrowserRouter>

      <LanguageProvider>

        <SmoothScroll />

        <App />

      </LanguageProvider>

    </BrowserRouter>

  </React.StrictMode>
);