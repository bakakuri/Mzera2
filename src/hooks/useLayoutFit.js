import { useEffect } from "react";

// Keeps --mz-hdr/--mz-nav CSS vars in sync with the real header/bottom-nav
// element sizes (re-measured on every tab change and via ResizeObserver,
// since a stale value here misplaces any fixed-position panel that reads
// them, e.g. the chat conversation view), and nudges a focused input/textarea
// toward the center of the screen once the on-screen keyboard has settled.
export function useLayoutFit(tab) {
  useEffect(() => {
    const measure = () => {
      const h = document.querySelector("header.mz-hdr"); const n = document.querySelector("nav.mz-nav");
      const root = document.documentElement;
      // only ever set from a real, currently-mounted element — never clear/fall back
      // to nothing when a fullBleed tab (map/reels) temporarily removes the header,
      // otherwise fixed panels like the chat view (top: var(--mz-hdr)) that render on
      // the very next tab would inherit a stale or unset value and misposition
      if (h) root.style.setProperty("--mz-hdr", h.offsetHeight + "px");
      if (n) root.style.setProperty("--mz-nav", n.offsetHeight + "px");
    };
    measure(); const t1 = setTimeout(measure, 200); const t2 = setTimeout(measure, 800);
    window.addEventListener("resize", measure);
    // the on-screen keyboard resizes the visual viewport on most mobile browsers
    // without firing a window "resize" event, which otherwise leaves --mz-nav
    // stuck at whatever it was measured as while the keyboard was open
    if (window.visualViewport) window.visualViewport.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    const h0 = document.querySelector("header.mz-hdr"); const n0 = document.querySelector("nav.mz-nav");
    if (h0) ro.observe(h0);
    if (n0) ro.observe(n0);
    return () => {
      window.removeEventListener("resize", measure);
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", measure);
      clearTimeout(t1); clearTimeout(t2); ro.disconnect();
    };
  }, [tab]);

  useEffect(() => {
    const measureNow = () => {
      const h = document.querySelector("header.mz-hdr"); const n = document.querySelector("nav.mz-nav");
      const root = document.documentElement;
      if (h) root.style.setProperty("--mz-hdr", h.offsetHeight + "px");
      if (n) root.style.setProperty("--mz-nav", n.offsetHeight + "px");
    };
    const onFocusIn = (e) => {
      const el = e.target;
      if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) {
        setTimeout(() => { try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (err) {} }, 320);
      }
    };
    // re-measure once the keyboard has closed (focus leaving an input/textarea) —
    // covers browsers where closing the keyboard doesn't trigger a resize event
    const onFocusOut = (e) => {
      const el = e.target;
      if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) setTimeout(measureNow, 350);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => { document.removeEventListener("focusin", onFocusIn); document.removeEventListener("focusout", onFocusOut); };
  }, []);
}
