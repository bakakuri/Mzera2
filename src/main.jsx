import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// React render-შიდა შეცდომა ეკრანზე ლამაზად გამოაჩინოს (თეთრი ეკრანის ნაცვლად)
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) {
    if (typeof window !== "undefined" && window.__mzeraErr) {
      window.__mzeraErr((err && err.stack) || (err && err.message) || String(err));
    }
  }
  render() {
    if (!this.state.err) return this.props.children;
    const msg = (this.state.err && (this.state.err.stack || this.state.err.message)) || String(this.state.err);
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#F3F5F9", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 380, width: "100%", background: "#fff", borderRadius: 20, padding: "28px 24px", boxShadow: "0 16px 40px -12px rgba(17,19,26,.18)", textAlign: "center" }}>
          <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 12 }}>😕</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#13161F", marginBottom: 6 }}>რაღაც არასწორად მოხდა</div>
          <div style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.5, marginBottom: 20 }}>გვერდი ვერ ჩაიტვირთა გამართულად. სცადეთ განახლება.</div>
          <button onClick={() => window.location.reload()} style={{ width: "100%", padding: 12, border: "none", borderRadius: 14, background: "#6750F2", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>გვერდის განახლება</button>
          <details style={{ textAlign: "left", marginTop: 6 }}>
            <summary style={{ cursor: "pointer", fontSize: 12, color: "#9aa1ae", userSelect: "none" }}>ტექნიკური დეტალები</summary>
            <div style={{ marginTop: 8, padding: 10, background: "#F4F6FA", borderRadius: 10, fontSize: 11, lineHeight: 1.6, color: "#c01818", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 220, overflow: "auto" }}>{msg}</div>
          </details>
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register the service worker (PWA install + web push). Safe no-op if unsupported.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
