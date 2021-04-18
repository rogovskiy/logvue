import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BrowserRouter, Route } from "react-router-dom";
import 'app.global.css';

import { FileStateProvider } from "./FileStateProvider";

ReactDOM.render(
  // <React.StrictMode>
  <FileStateProvider>
    {/* <BrowserRouter> */}
      <div className="App">
        <App />
        {/* <Route path="/" exact component={App} /> */}
      </div>
    {/* </BrowserRouter> */}
  </FileStateProvider>,
  // </React.StrictMode>,
  document.getElementById("root")
);
