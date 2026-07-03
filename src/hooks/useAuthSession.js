import { useState, useEffect } from "react";
import { authApi, profilesApi, hasSupabase, pushApi, USERS, ME } from "../ui/core";
import { registerPush, unregisterPush, currentPushState } from "../lib/push";

// Supabase auth session + onboarding/profile-settings state + web push
// subscription toggle. Loading the actual feed/profile data once a session
// exists is orchestrated in App.jsx (it needs other hooks' load functions),
// this hook only owns the session object itself and the account-settings UI
// state that isn't tied to any one content domain.
export function useAuthSession({ flash, reloadFeed }) {
  const [session, setSession] = useState(undefined);
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settings, setSettings] = useState({ private: false, activity: true, showLocation: true, nLikes: true, nComments: true, nFollows: true, nMessages: true, lang: "ka" });
  const [meProfile, setMeProfile] = useState({ name: "", bio: "", avatar: null, cover: null });
  const [pushState, setPushState] = useState("off");

  useEffect(() => {
    const l = document.createElement("link"); l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+Georgian:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(l); return () => { try { document.head.removeChild(l); } catch (e) {} };
  }, []);

  useEffect(() => {
    if (!hasSupabase) return;
    authApi.getSession().then((s) => setSession(s || null)).catch(() => setSession(null));
    const sub = authApi.onChange((s) => setSession(s || null));
    return () => { try { sub.data.subscription.unsubscribe(); } catch (e) {} };
  }, []);

  useEffect(() => {
    if (!session || !hasSupabase) return;
    let cancelled = false;
    currentPushState().then(st => {
      if (cancelled) return;
      setPushState(st);
      if (st === "on" && typeof Notification !== "undefined" && Notification.permission === "granted") registerPush(pushApi).catch(() => {});
    });
    return () => { cancelled = true; };
  }, [session]);

  const onTogglePush = async () => {
    if (pushState === "on") { await unregisterPush(pushApi); setPushState("off"); flash("Push გამოირთო"); return; }
    const res = await registerPush(pushApi);
    if (res.ok) { setPushState("on"); flash("Push შეტყობინებები ჩაირთო 🔔"); }
    else if (res.reason === "denied") { setPushState("denied"); flash("ბრაუზერმა დაბლოკა — ჩართე პარამეტრებიდან"); }
    else if (res.reason === "unsupported") { setPushState("unsupported"); flash("ამ ბრაუზერს არ აქვს მხარდაჭერა"); }
    else flash("ვერ ჩაირთო, სცადე თავიდან");
  };

  const onSaveOnboardProfile = (name, bio) => {
    const patch = { bio: bio || "" }; if (name) patch.name = name;
    USERS[ME] = { ...USERS[ME], name: name || USERS[ME].name, bio: bio || "" };
    setMeProfile(p => ({ ...p, name: name || p.name, bio: bio || "" }));
    if (hasSupabase) profilesApi.update(ME, patch).catch(() => {});
  };
  const onFinishOnboarding = () => { setShowOnboarding(false); if (hasSupabase) profilesApi.update(ME, { onboarded: true }).catch(() => {}); reloadFeed(); };

  return {
    session, setSession, ready, setReady,
    showOnboarding, setShowOnboarding,
    settings, setSettings, meProfile, setMeProfile,
    pushState, onTogglePush,
    onSaveOnboardProfile, onFinishOnboarding,
  };
}
