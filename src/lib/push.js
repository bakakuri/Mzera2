// Web Push client helper for mzera.
// VAPID public key — pairs with the private key stored in the Supabase Edge Function.
export const VAPID_PUBLIC = "BMDSMbM00QyO6iFuTSxGACG9wpj7Lui5_mVfxnpi5cOmkypXUpg8cOB0DdUJNMN6qBEfchI9g7SG44S4GAtk8Lc";

function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// "unsupported" | "denied" | "on" | "off"
export async function currentPushState() {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub ? "on" : "off";
  } catch (e) { return "off"; }
}

// Requests permission (if needed), subscribes, and saves the subscription via pushApi.
export async function registerPush(pushApi) {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: perm === "denied" ? "denied" : "dismissed" };
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC),
      });
    }
    await pushApi.subscribe(sub);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: e };
  }
}

export async function unregisterPush(pushApi) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      try { await pushApi.unsubscribe(sub.endpoint); } catch (e) {}
      await sub.unsubscribe();
    }
  } catch (e) {}
}
