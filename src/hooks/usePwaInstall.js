import { useState, useEffect } from "react";

// "Add to home screen" prompt handling for the PWA install banner.
export function usePwaInstall() {
  const [installEvt, setInstallEvt] = useState(null);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); if (!window.matchMedia("(display-mode: standalone)").matches) setInstallEvt(e); };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const doInstall = async () => {
    if (!installEvt) return;
    const e = installEvt;
    setInstallEvt(null);
    try { e.prompt(); await e.userChoice; } catch (err) {}
  };

  return { installEvt, setInstallEvt, doInstall };
}
