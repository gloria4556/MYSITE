import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./styles/admin.css";
import "./styles/form.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const root = createRoot(document.getElementById("root"));
root.render(
  <>
    <App />
    <ToastContainer position="top-right" autoClose={3000} />
  </>,
);
