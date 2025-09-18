import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HashRouter, BrowserRouter } from "react-router-dom";

const Router = import.meta.env.DEV ? BrowserRouter : HashRouter;
const routerProps = import.meta.env.DEV ? {} : {};

createRoot(document.getElementById("root")!).render(
  <Router {...routerProps}>
    <App />
  </Router>
);
