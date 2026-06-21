import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// React render-შიდა შეცდომა ეკრანზე გამოაჩინოს
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(err) {
    if (typeof window !== "undefined" && window.__mzeraErr) {
      window.__mzeraErr((err && err.stack) || (err && err.message) || String(err));
    }
  }
  render() { return this.state.crashed ? null : this.props.children; }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
