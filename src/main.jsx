import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import PaperScoutApp from "./paperscout/PaperScoutApp.jsx";
import "./paper-scout.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <PaperScoutApp />
    </BrowserRouter>
  </StrictMode>,
);
