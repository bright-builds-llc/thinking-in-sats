/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import "./styles/tokens.css";
import "./styles/global.css";

const maybeRoot = document.getElementById("root");

if (maybeRoot === null) {
  throw new Error("Missing root element");
}

render(() => <App />, maybeRoot);
