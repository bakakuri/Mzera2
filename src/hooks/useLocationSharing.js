import { useState, useEffect, useRef } from "react";
import { locationsApi, mergeProfile, USERS, ME, pushNotif, t } from "../ui/core";

export const LOCATION_REFRESH_MS = 30 * 60 * 1000; // re-share every 30 minutes
export const LOCATION_STALE_MS = 60 * 60 * 1000; // hide a pin once it's this old
const NEARBY_KM = 0.5; // notify once a mutual follower is within this radius
const NEARBY_CLEAR_KM = 0.7; // hysteresis: re-arm the notification once they leave this radius

function haversineKm(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]), dLng = toRad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// App-level (not screen-level) so the 30-minute refresh keeps running for as
// long as the app itself is open, not just while the Map tab is on screen —
// and resumes automatically on load if the user was already sharing.
export function useLocationSharing({ live, onNearby }) {
  const [sharing, setSharing] = useState(false);
  const [myPos, setMyPos] = useState(null);
  const [myAccuracy, setMyAccuracy] = useState(null);
  const [lastSharedAt, setLastSharedAt] = useState(null);
  const [geoErr, setGeoErr] = useState("");
  const [busy, setBusy] = useState(false);
  const intervalRef = useRef(null);
  const nearbyRef = useRef(new Set());

  const stopInterval = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  const checkNearby = async (pos) => {
    if (!pos) return;
    try {
      const rows = await locationsApi.shared();
      rows.forEach(r => { if (r.profile) mergeProfile(r.profile); });
      rows.forEach(r => {
        if (r.user_id === ME || r.lat == null || r.lng == null) return;
        const d = haversineKm(pos, [r.lat, r.lng]);
        const already = nearbyRef.current.has(r.user_id);
        if (d <= NEARBY_KM && !already) {
          nearbyRef.current.add(r.user_id);
          const name = (USERS[r.user_id] && USERS[r.user_id].name) || "?";
          pushNotif(name, t("map.nearbyBody"));
          if (onNearby) onNearby(`${name} ${t("map.nearbySuffix")}`);
        } else if (d > NEARBY_CLEAR_KM && already) {
          nearbyRef.current.delete(r.user_id);
        }
      });
    } catch (e) {}
  };

  const captureAndShare = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error(t("map.notSupported"))); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setMyPos([lat, lng]); setMyAccuracy(pos.coords.accuracy || null);
        locationsApi.share(lat, lng).then(() => { setLastSharedAt(Date.now()); checkNearby([lat, lng]); resolve(); }).catch(reject);
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
    nearbyRef.current.clear();
    locationsApi.stop().then(() => setSharing(false)).catch(() => {}).finally(() => setBusy(false));
  };

  const refreshNow = () => {
    if (!sharing || busy) return;
    setGeoErr(""); setBusy(true);
    captureAndShare()
      .then(() => {
        stopInterval();
        intervalRef.current = setInterval(() => { captureAndShare().catch(() => {}); }, LOCATION_REFRESH_MS);
      })
      .catch((e) => setGeoErr((e && e.message) || t("map.saveFailed")))
      .finally(() => setBusy(false));
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

  return { sharing, myPos, myAccuracy, lastSharedAt, geoErr, setGeoErr, busy, start, stop, refreshNow };
}
