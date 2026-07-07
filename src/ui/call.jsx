import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { calls as callsApi } from "../lib/api";
import { C, USERS, DISPLAY, Avatar, Mono, Phone, Video, PhoneOff, Mic, MicOff, VideoOff } from "./core";

const STUN = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
// Best-effort free TURN relay (needed to connect peers behind mobile/carrier NAT).
const FALLBACK_TURN = [
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turns:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];
// 👉 RECOMMENDED for reliable mobile calls: free metered.ca account (5GB/mo).
//    dashboard.metered.ca → create app → paste subdomain + API key below.
const METERED_SUBDOMAIN = ""; // e.g. "mzera"  (from  mzera.metered.live)
const METERED_API_KEY = "";   // e.g. "1a2b3c4d..."

let _iceCache = null;
async function getIceServers() {
  if (_iceCache) return _iceCache;
  if (METERED_SUBDOMAIN && METERED_API_KEY) {
    try {
      const r = await fetch("https://" + METERED_SUBDOMAIN + ".metered.live/api/v1/turn/credentials?apiKey=" + METERED_API_KEY);
      const s = await r.json();
      if (Array.isArray(s) && s.length) { _iceCache = s; return _iceCache; }
    } catch (e) {}
  }
  _iceCache = [...STUN, ...FALLBACK_TURN];
  return _iceCache;
}

export const CallLayer = forwardRef(function CallLayer({ me, enabled }, ref) {
  const [call, setCall] = useState(null); // { state, peer, video, muted, camOff }
  const [secs, setSecs] = useState(0);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const outboundRef = useRef({});
  const offerRef = useRef(null);
  const iceQueueRef = useRef([]);
  const callRef = useRef(null);
  useEffect(() => { callRef.current = call; }, [call]);

  useEffect(() => {
    if (call && call.state === "connected") { setSecs(0); const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }
  }, [call && call.state]);

  useEffect(() => {
    if (!call || call.state === "connected") return;
    const limit = call.state === "incoming" ? 45000 : 40000;
    const t = setTimeout(() => { const c = callRef.current; if (c && c.state !== "connected") { if (c.state === "incoming") decline(); else endCall(true); } }, limit);
    return () => clearTimeout(t);
  }, [call && call.state]);

  useEffect(() => {
    const s = remoteStreamRef.current; if (!s || !call) return;
    const el = call.video ? remoteVideoRef.current : remoteAudioRef.current;
    if (el && el.srcObject !== s) { try { el.srcObject = s; } catch (e) {} }
    if (el) el.play && el.play().catch(() => {});
  }, [call && call.state, call && call.video]);

  const getOut = (peerId) => {
    let entry = outboundRef.current[peerId];
    if (!entry) {
      const ch = callsApi.channel(peerId);
      entry = { ch, ready: false, queue: [] };
      outboundRef.current[peerId] = entry;
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          entry.ready = true;
          const q = entry.queue; entry.queue = [];
          q.forEach(m => { try { ch.send(m); } catch (e) {} });
        }
      });
    }
    return entry;
  };
  const sendTo = (peerId, kind, data) => {
    const entry = getOut(peerId);
    const msg = { type: "broadcast", event: "signal", payload: { kind, from: me, to: peerId, ...data } };
    if (entry.ready) { try { entry.ch.send(msg); } catch (e) { entry.queue.push(msg); } }
    else entry.queue.push(msg);
  };

  const cleanup = () => {
    try { if (pcRef.current) pcRef.current.close(); } catch (e) {}
    pcRef.current = null;
    if (localStreamRef.current) { try { localStreamRef.current.getTracks().forEach(t => t.stop()); } catch (e) {} localStreamRef.current = null; }
    offerRef.current = null; iceQueueRef.current = [];
    Object.values(outboundRef.current).forEach(e => { try { e.ch.unsubscribe(); } catch (er) {} });
    outboundRef.current = {}; setSecs(0);
  };
  const endCall = (notify) => { const c = callRef.current; if (notify && c) sendTo(c.peer.id, "hangup", {}); cleanup(); setCall(null); };

  const attachStreams = () => {
    if (localVideoRef.current && localStreamRef.current) localVideoRef.current.srcObject = localStreamRef.current;
  };

  const makePc = (peerId, iceServers) => {
    const pc = new RTCPeerConnection({ iceServers });
    pc.onicecandidate = (e) => { if (e.candidate) sendTo(peerId, "ice", { candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.ontrack = (e) => {
      const stream = (e.streams && e.streams[0]) || (e.track && new MediaStream([e.track]));
      if (!stream) return;
      remoteStreamRef.current = stream;
      const el = (callRef.current && callRef.current.video) ? remoteVideoRef.current : remoteAudioRef.current;
      if (el) { try { el.srcObject = stream; } catch (er) {} el.play && el.play().catch(() => {}); }
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "connected") setCall(c => c ? { ...c, state: "connected" } : c);
      else if (st === "failed") endCall(false);
    };
    pc.oniceconnectionstatechange = () => {
      const st = pc.iceConnectionState;
      if (st === "connected" || st === "completed") setCall(c => c ? { ...c, state: "connected" } : c);
      else if (st === "failed") endCall(false);
    };
    pcRef.current = pc;
    return pc;
  };

  const getMedia = async (video) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false });
    localStreamRef.current = stream;
    requestAnimationFrame(attachStreams);
    return stream;
  };

  const startCall = async (peer, video) => {
    if (callRef.current) return;
    if (!navigator.mediaDevices || !window.RTCPeerConnection) { alert("ამ მოწყობილობაზე ზარები არ არის მხარდაჭერილი."); return; }
    setCall({ state: "outgoing", peer, video: !!video, muted: false, camOff: false });
    try {
      const iceServers = await getIceServers();
      const pc = makePc(peer.id, iceServers);
      const stream = await getMedia(!!video);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendTo(peer.id, "offer", { sdp: { type: offer.type, sdp: offer.sdp }, video: !!video, fromName: (USERS[me] && USERS[me].name) || "" });
    } catch (e) { endCall(false); }
  };

  const accept = async () => {
    const c = callRef.current; if (!c || c.state !== "incoming" || !offerRef.current) return;
    try {
      const iceServers = await getIceServers();
      const pc = makePc(c.peer.id, iceServers);
      const stream = await getMedia(c.video);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      await pc.setRemoteDescription(offerRef.current);
      iceQueueRef.current.forEach(cand => { pc.addIceCandidate(cand).catch(() => {}); });
      iceQueueRef.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendTo(c.peer.id, "answer", { sdp: { type: answer.type, sdp: answer.sdp } });
      setCall(cc => cc ? { ...cc, state: "connecting" } : cc);
    } catch (e) { endCall(true); }
  };
  const decline = () => { const c = callRef.current; if (c) sendTo(c.peer.id, "decline", {}); cleanup(); setCall(null); };

  const onSignal = async (p) => {
    if (!p || p.to !== me) return;
    const c = callRef.current;
    if (p.kind === "offer") {
      if (c) { sendTo(p.from, "busy", {}); return; }
      offerRef.current = p.sdp;
      const peer = { id: p.from, name: (USERS[p.from] && USERS[p.from].name) || p.fromName || "ზარი" };
      setCall({ state: "incoming", peer, video: !!p.video, muted: false, camOff: false });
      try { navigator.vibrate && navigator.vibrate([400, 200, 400, 200, 400]); } catch (e) {}
    } else if (p.kind === "answer") {
      if (c && pcRef.current && c.peer.id === p.from && !pcRef.current.currentRemoteDescription) {
        try {
          await pcRef.current.setRemoteDescription(p.sdp);
          const q = iceQueueRef.current; iceQueueRef.current = [];
          q.forEach(cand => pcRef.current.addIceCandidate(cand).catch(() => {}));
          setCall(cc => (cc && cc.state === "outgoing") ? { ...cc, state: "connecting" } : cc);
        } catch (e) {}
      }
    } else if (p.kind === "ice") {
      if (pcRef.current && pcRef.current.remoteDescription) { try { await pcRef.current.addIceCandidate(p.candidate); } catch (e) {} }
      else iceQueueRef.current.push(p.candidate);
    } else if (p.kind === "hangup" || p.kind === "decline" || p.kind === "busy") {
      if (c && c.peer.id === p.from) { cleanup(); setCall(null); }
    }
  };

  useEffect(() => {
    if (!enabled || !me) return;
    getIceServers();
    const ch = callsApi.channel(me);
    ch.on("broadcast", { event: "signal" }, ({ payload }) => onSignal(payload));
    ch.subscribe();
    return () => { try { ch.unsubscribe(); } catch (e) {} cleanup(); setCall(null); };
  }, [enabled, me]);

  useImperativeHandle(ref, () => ({ startCall, busy: () => !!callRef.current }), [me]);

  const toggleMute = () => { const s = localStreamRef.current; if (!s) return; const on = !call.muted; s.getAudioTracks().forEach(t => (t.enabled = !on)); setCall(c => ({ ...c, muted: on })); };
  const toggleCam = () => { const s = localStreamRef.current; if (!s) return; const off = !call.camOff; s.getVideoTracks().forEach(t => (t.enabled = !off)); setCall(c => ({ ...c, camOff: off })); };

  if (!call) return null;
  const statusText = call.state === "incoming" ? (call.video ? "შემოსული ვიდეო ზარი" : "შემოსული ზარი") : call.state === "outgoing" ? "რეკავს…" : call.state === "connecting" ? "ეკავშირდება…" : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const connectedVideo = call.state === "connected" && call.video;
  return (
    <div className="fixed inset-0 z-[100]" style={{ background: "#0b0e16" }}>
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
      {call.video && <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", background: "#0b0e16" }} />}
      {call.video && <video ref={localVideoRef} autoPlay playsInline muted className="absolute rounded-2xl" style={{ width: 108, height: 150, objectFit: "cover", top: 18, right: 14, border: "2px solid rgba(255,255,255,.35)", zIndex: 4, display: (connectedVideo && !call.camOff) ? "block" : "none" }} />}
      {(!connectedVideo) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6" style={{ zIndex: 3, background: call.video ? "rgba(11,14,22,.55)" : "transparent" }}>
          <div style={{ animation: call.state !== "connected" ? "pulse 1.6s ease-in-out infinite" : "none" }}><Avatar id={call.peer.id} size={116} /></div>
          <div className="text-center"><div className="text-white font-bold text-[25px]" style={{ fontFamily: DISPLAY }}>{call.peer.name}</div><Mono className="block" style={{ color: "rgba(255,255,255,.72)", fontSize: 14, marginTop: 6 }}>{statusText}</Mono></div>
        </div>
      )}
      {connectedVideo && (
        <div className="absolute top-0 inset-x-0 p-5 text-center" style={{ zIndex: 4, background: "linear-gradient(rgba(0,0,0,.45),transparent)" }}>
          <div className="text-white font-bold text-[17px]">{call.peer.name}</div><Mono style={{ color: "rgba(255,255,255,.85)", fontSize: 13 }}>{statusText}</Mono>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 pt-10 flex items-center justify-center gap-5" style={{ zIndex: 5, paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))", background: "linear-gradient(transparent, rgba(0,0,0,.55))" }}>
        {call.state === "incoming" ? (
          <>
            <button onClick={decline} aria-label="ზარის უარყოფა" className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 68, height: 68, background: "#ef4444" }}><PhoneOff size={28} color="#fff" /></button>
            <button onClick={accept} aria-label="ზარზე პასუხი" className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 68, height: 68, background: "#22c55e" }}><Phone size={28} color="#fff" /></button>
          </>
        ) : (
          <>
            <button onClick={toggleMute} aria-label={call.muted ? "მიკროფონის ჩართვა" : "მიკროფონის გამორთვა"} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 56, height: 56, background: call.muted ? "#fff" : "rgba(255,255,255,.16)" }}>{call.muted ? <MicOff size={23} color="#0b0e16" /> : <Mic size={23} color="#fff" />}</button>
            {call.video && <button onClick={toggleCam} aria-label={call.camOff ? "კამერის ჩართვა" : "კამერის გამორთვა"} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 56, height: 56, background: call.camOff ? "#fff" : "rgba(255,255,255,.16)" }}>{call.camOff ? <VideoOff size={23} color="#0b0e16" /> : <Video size={23} color="#fff" />}</button>}
            <button onClick={() => endCall(true)} aria-label="ზარის დასრულება" className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 68, height: 68, background: "#ef4444" }}><PhoneOff size={28} color="#fff" /></button>
          </>
        )}
      </div>
    </div>
  );
});
