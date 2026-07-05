import { useState, useEffect, useRef } from "react";
import { locationsApi, t } from "../ui/core";

export const LOCATION_REFRESH_MS = 30 * 60 * 1000; // re-share every 30 minutes
export const LOCATION_STALE_MS = 60 * 60 * 1000; // hide a pin once it's this old

// App-level (not screen-level) so the 30-minute refresh keeps running for as
// long as the app itself is open, not just while the Map tab is on screen —
// and resumes automatically on load if the user was already sharing.
export function useLocationSharing({ live }) {
  const [sharing, setSharing] = useState(false);
  const [myPos, setMyPos] = useState(null);
  const [myAccuracy, setMyAccuracy] = useState(null);
  const [lastSharedAt, setLastSharedAt] = useState(null);
  const [geoErr, setGeoErr] = useState("");
  const [busy, setBusy] = useState(false);
  const intervalRef = useRef(null);

  const stopInterval = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  const captureAndShare = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error(t("map.notSupported"))); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setMyPos([lat, lng]); setMyAccuracy(pos.coords.accuracy || null);
        locationsApi.share(lat, lng).then(() => { setLastSharedAt(Date.now()); resolve(); }).catch(reject);
      },
      () => reject(new Error(t("map.permissionDenied"))),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });

  const start = () => {
    setGeoErr(""); setBusy(true);
    captureAndShare()
      .then(() => {
        setSharing(true);
        stopInterval();
        intervalRef.current = setInterval(() => { captureAndShare().catch(() => {}); }, LOCATION_REFRESH_MS);
      })
      .catch((e) => setGeoErr((e && e.message) || t("map.saveFailed")))
      .finally(() => setBusy(false));
  };

  const stop = () => {
    setBusy(true);
    stopInterval();
    locationsApi.stop().then(() => setSharing(false)).catch(() => {}).finally(() => setBusy(false));
  };

  useEffect(() => {
    if (!live) { stopInterval(); return; }
    let cancelled = false;
    locationsApi.mine().then((m) => {
      if (cancelled || !m || !m.shared) return;
      setSharing(true);
      if (m.lat != null) setMyPos([m.lat, m.lng]);
      if (m.updated_at) setLastSharedAt(new Date(m.updated_at).getTime());
      stopInterval();
      captureAndShare().catch(() => {});
      intervalRef.current = setInterval(() => { captureAndShare().catch(() => {}); }, LOCATION_REFRESH_MS);
    }).catch(() => {});
    return () => { cancelled = true; stopInterval(); };
  }, [live]);

  return { sharing, myPos, myAccuracy, lastSharedAt, geoErr, setGeoErr, busy, start, stop };
}
