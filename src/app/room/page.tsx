"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useAntiGravity } from "@/hooks/useAntiGravity";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

const AntiGravityEngine = dynamic(() => import('@/components/AntiGravityEngine'), { ssr: false });

export default function WaitingRoomPage() {
  const [queuePos, setQueuePos] = useState(3);
  const [connected, setConnected] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const { t } = useLanguage();
  
  // Anti-Gravity hook
  const { onLogoClick } = useAntiGravity();
  
  // Room UI state (screenshot parity)
  const [activeTab, setActiveTab] = useState<"scribe" | "patient" | "chat">("scribe");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [doctorCameraOff, setDoctorCameraOff] = useState(true);
  const [scribeActive, setScribeActive] = useState(true);

  const [transcribing, setTranscribing] = useState(true);
  const [soapStage, setSoapStage] = useState(0); // 0: nothing, 1: CC, 2: HPI, 3: Past Med + stop anim

  const [chatMessages, setChatMessages] = useState<
    Array<{ from: "doctor" | "patient"; text: string }>
  >([]);
  const [chatDraft, setChatDraft] = useState("");

  useEffect(() => {
    if (queuePos > 0) {
      const timer = setTimeout(() => setQueuePos(q => q - 1), 2500);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setConnected(true), 1500);
    }
  }, [queuePos]);

  // Best-effort local video preview (mock UI still works if denied).
  useEffect(() => {
    if (!connected) return;

    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setVideoReady(true);
      })
      .catch(() => {
        // Permission denied: keep placeholders.
        setVideoReady(false);
      });

    return () => {
      cancelled = true;
      const stream = localStreamRef.current;
      localStreamRef.current = null;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setVideoReady(false);
    };
  }, [connected]);

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = micOn;
    });
    stream.getVideoTracks().forEach((t) => {
      t.enabled = cameraOn;
    });
  }, [micOn, cameraOn]);

  useEffect(() => {
    if (!connected) return;

    setChatMessages([
      { from: "doctor", text: "Hello Arjun. I’m reviewing your vitals and will proceed with Ambient Scribe." },
      { from: "patient", text: "Thanks, Doctor. Please go ahead." },
    ]);
  }, [connected]);

  useEffect(() => {
    if (!connected || !scribeActive) {
      setTranscribing(false);
      setSoapStage(0);
      return;
    }

    setTranscribing(true);
    setSoapStage(0);

    const t0 = window.setTimeout(() => setSoapStage(1), 900);
    const t1 = window.setTimeout(() => setSoapStage(2), 2400);
    const t2 = window.setTimeout(() => setSoapStage(3), 4200);
    const t3 = window.setTimeout(() => setTranscribing(false), 6500);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [connected, scribeActive]);

  const toggleMic = () => {
    setMicOn((v) => !v);
    toast.success(micOn ? "MIC OFF" : "MIC ON");
  };

  const toggleCamera = () => {
    setCameraOn((v) => !v);
    toast.success(cameraOn ? "CAMERA OFF" : "CAMERA ON");
  };

  const toggleSpeaker = () => {
    setSpeakerOn((v) => !v);
    toast.success(speakerOn ? "SPEAKER MUTED" : "SPEAKER ON");
  };

  const endCall = () => {
    toast.success("Encounter ended (mock).");
    setConnected(false);
    setQueuePos(3);
    setActiveTab("scribe");
    setScribeActive(true);
    setDoctorCameraOff(true);
  };

  const onFinalize = () => {
    toast.success("Encounter finalized & signed (mock).");
    endCall();
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_10%,rgba(6,182,212,0.18),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.16),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(56,189,248,0.10),transparent_40%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:54px_54px] opacity-30" />
      <AntiGravityEngine />

      {/* Navbar area */}
      <div className="flex justify-between items-center p-6 border-b border-white/5 z-10 bg-black/60 backdrop-blur-2xl" data-floatable="true">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Back to dashboard"
          >
            ←
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center font-bold text-lg cursor-pointer select-none shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              onClick={onLogoClick}
              data-floatable="true"
              title="VitaLink"
            >
              V
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-300">{t.live}</span>
              </div>
              <span className="text-sm font-bold tracking-tight text-white/80">{t.vitalink}</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold tracking-widest text-cyan-400">
            {t.teleconsultation}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-bold hidden lg:flex items-center gap-2"
            aria-label="Ambient scribe status"
          >
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {scribeActive ? t.ambientScribeActive : t.ambientScribe}
          </div>

          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5">
            <span className="text-xs font-mono text-white/60">{t.session} 0x8F9...</span>
            <span className="text-xs font-bold text-emerald-400">{t.good}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
      
         {!connected ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-black/40 border border-white/10 rounded-3xl p-12 max-w-md w-full text-center backdrop-blur-xl z-10 shadow-2xl"
             data-floatable="true"
           >
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto mb-6 flex items-center justify-center overflow-hidden border-4 border-black relative shadow-[0_0_30px_rgba(37,99,235,0.3)]" data-floatable="true">
                 <div className="text-5xl text-white">👩‍⚕️</div>
                 {queuePos === 0 && <div className="absolute inset-0 bg-green-500/50 mix-blend-overlay animate-pulse" />}
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Virtual Queue</h2>
              
              {queuePos > 0 ? (
                <>
                  <p className="text-white/50 mb-8 font-medium">Dr. Sharma is finishing up charting via Ambient Scribe.</p>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-bold">
                       <span className="text-white/50">Your Queue Position</span>
                       <span className="text-cyan-400">#{queuePos}</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                         className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                         initial={{ width: "20%" }}
                         animate={{ width: `${100 - (queuePos * 30)}%` }}
                         transition={{ duration: 1 }}
                       />
                    </div>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                   <p className="text-green-400 font-bold mb-6">Connecting WebRTC Node...</p>
                   <div className="flex justify-center gap-2">
                      <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                   </div>
                </motion.div>
              )}
           </motion.div>
         ) : (
           <motion.div 
             initial={{ opacity: 0, scale: 0.98 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-full h-full max-w-7xl max-h-[85vh] bg-[#030303] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col"
           >
              <div className="flex-1 flex overflow-hidden">
                {/* Doctor video area */}
                <div
                  className="flex-1 relative bg-gradient-to-tr from-gray-900 to-[#111] flex items-center justify-center"
                  data-floatable="true"
                >
                  {/* Top status (doctor camera off) */}
                  {doctorCameraOff && (
                    <div
                      className="absolute top-6 left-6 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2"
                      data-floatable="true"
                    >
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-white/80">{t.docCameraOff}</span>
                    </div>
                  )}

                  {/* Placeholder doctor frame */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className="w-56 h-56 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-xl flex items-center justify-center shadow-[0_0_35px_rgba(59,130,246,0.10)]"
                      data-floatable="true"
                    >
                      <span className="text-4xl font-black tracking-widest text-white/85">PS</span>
                    </div>
                    <div className="mt-5 font-mono text-xs tracking-widest text-blue-200/40">
                      WEBRTC FEDERATED STREAM
                    </div>
                  </div>

                  {/* Doctor info card */}
                  <div
                    className="absolute bottom-20 left-10 w-[320px] rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 shadow-2xl"
                    data-floatable="true"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-bold">Dr. Priya Sharma</div>
                        <div className="text-xs text-white/50 mt-1">
                          {t.cardiology} • {t.mbbs}, {t.yrs}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center font-bold text-cyan-300">
                        PS
                      </div>
                    </div>
                  </div>

                  {/* Self/Patient tile */}
                  <div
                    className="absolute bottom-24 right-12 w-[250px] h-[170px] rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl overflow-hidden"
                    data-floatable="true"
                  >
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-green-500/20 text-green-300 text-[10px] font-bold rounded-full border border-green-500/20">
                      ZKP ID OK
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {cameraOn && videoReady ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-white/5 to-transparent">
                          <div className="text-5xl font-black text-white/80 tracking-widest">AK</div>
                          <div className="mt-2 text-xs font-mono text-white/40">PATIENT PREVIEW</div>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="text-xs text-white/70">
                        Arjun Kumar <span className="text-white/40">(You)</span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-300 font-black">
                        ✓
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right panel: Ambient Scribe / Patient / Chat */}
                <div className="w-[420px] border-l border-white/5 bg-white/[0.02] backdrop-blur-3xl flex flex-col relative z-20">
                  <div className="p-6 border-b border-white/5 bg-blue-900/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <h3 className="font-bold text-lg text-blue-400">{t.ambientScribe}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setScribeActive((v) => !v);
                          setActiveTab("scribe");
                        }}
                        className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors ${
                          scribeActive
                            ? "bg-blue-600/20 border-blue-500/30 text-blue-200"
                            : "bg-white/[0.04] border-white/10 text-white/50"
                        }`}
                      >
                        {t.voiceToFhir}
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {[
                          { ch: "S", on: soapStage >= 1 },
                          { ch: "O", on: soapStage >= 2 },
                          { ch: "A", on: soapStage >= 2 },
                          { ch: "P", on: soapStage >= 3 },
                        ].map((x) => (
                          <span
                            key={x.ch}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-black ${
                              x.on
                                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-200"
                                : "bg-white/[0.03] border-white/10 text-white/40"
                            }`}
                          >
                            {x.ch}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {transcribing ? (
                          <div className="px-3 py-2 rounded-full bg-black/30 border border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {Array.from({ length: 4 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className="w-1.5 h-3 rounded-full bg-blue-400 animate-pulse"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] font-mono text-blue-200/70 whitespace-nowrap">
                                {t.transcribing}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-white/40 px-3 py-2 rounded-full bg-black/20 border border-white/5">
                            {t.ambientScribeActive}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("scribe")}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          activeTab === "scribe"
                            ? "bg-white/10 border-white/10 text-cyan-400"
                            : "bg-white/[0.02] border-white/5 text-white/50 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {t.scribeTab}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("patient")}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          activeTab === "patient"
                            ? "bg-white/10 border-white/10 text-cyan-400"
                            : "bg-white/[0.02] border-white/5 text-white/50 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {t.patientTab}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("chat")}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          activeTab === "chat"
                            ? "bg-white/10 border-white/10 text-cyan-400"
                            : "bg-white/[0.02] border-white/5 text-white/50 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {t.chatTab}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {activeTab === "scribe" && (
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-white/40 tracking-widest">
                            {t.chiefComplaint}
                          </div>
                          <AnimatePresence>
                            {soapStage >= 1 ? (
                              <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="text-sm text-white/85 leading-relaxed"
                              >
                                {t.ccContent}
                              </motion.p>
                            ) : (
                              <p className="text-sm text-white/30">
                                {transcribing ? "Transcribing chief complaint..." : "—"}
                              </p>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-3">
                          <div className="text-xs font-bold text-white/40 tracking-widest">
                            {t.history}
                          </div>
                          <AnimatePresence>
                            {soapStage >= 2 ? (
                              <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="text-sm text-white/85 leading-relaxed"
                              >
                                {t.historyContent}
                              </motion.p>
                            ) : (
                              <p className="text-sm text-white/30">
                                {transcribing ? "Transcribing history of present illness..." : "—"}
                              </p>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-3">
                          <div className="text-xs font-bold text-white/40 tracking-widest">
                            {t.pastMedical}
                          </div>
                          <AnimatePresence>
                            {soapStage >= 3 ? (
                              <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="text-sm text-white/85 leading-relaxed"
                              >
                                {t.pastMedicalContent}
                              </motion.p>
                            ) : (
                              <p className="text-sm text-white/30">
                                {transcribing ? "Transcribing past medical history..." : "—"}
                              </p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {activeTab === "patient" && (
                      <div className="space-y-4">
                        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                          <div className="text-xs font-bold text-white/40 tracking-widest">
                            {t.patient}
                          </div>
                          <div className="mt-2 text-sm text-white/85 font-bold">
                            Arjun Kumar <span className="text-white/45 font-normal">(You)</span>
                          </div>
                          <div className="mt-2 text-xs text-white/50 font-mono">
                            Session token verified via ZKP
                          </div>
                        </div>

                        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                          <div className="text-xs font-bold text-white/40 tracking-widest">
                            {t.chiefComplaint}
                          </div>
                          <p className="mt-2 text-sm text-white/85 leading-relaxed">
                            {t.ccContent}
                          </p>
                        </div>

                        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                          <div className="text-xs font-bold text-white/40 tracking-widest">
                            {t.history}
                          </div>
                          <p className="mt-2 text-sm text-white/85 leading-relaxed">
                            {t.historyContent}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === "chat" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {chatMessages.length === 0 ? (
                            <div className="text-sm text-white/40">No messages yet.</div>
                          ) : (
                            chatMessages.map((m, idx) => (
                              <div
                                key={idx}
                                className={`px-4 py-3 rounded-2xl border max-w-[90%] ${
                                  m.from === "doctor"
                                    ? "bg-blue-600/10 border-blue-500/20 text-blue-100 ml-0"
                                    : "bg-white/[0.03] border-white/10 text-white/80 ml-auto"
                                }`}
                              >
                                <div className="text-[10px] font-bold text-white/40 mb-1">
                                  {m.from === "doctor" ? "DOCTOR" : t.you}
                                </div>
                                <div className="text-sm leading-relaxed">{m.text}</div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex gap-2 items-center">
                          <input
                            value={chatDraft}
                            onChange={(e) => setChatDraft(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/30"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!chatDraft.trim()) return;
                              setChatMessages((prev) => [
                                ...prev,
                                { from: "patient", text: chatDraft.trim() },
                              ]);
                              setChatDraft("");
                              toast.success("Message sent (mock).");
                            }}
                            className="px-4 py-3 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-300 font-bold hover:bg-cyan-500/25 transition-colors"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-white/5 bg-black/20">
                    <button
                      type="button"
                      onClick={onFinalize}
                      className="w-full py-3 bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.1)]"
                    >
                      {t.finalize}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom in-call controls */}
              <div className="p-4 border-t border-white/5 bg-black/30 backdrop-blur-xl">
                <div className="flex items-end justify-between gap-2">
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`w-[78px] h-[78px] rounded-2xl border transition-colors flex flex-col items-center justify-center gap-2 ${
                      micOn ? "bg-white/[0.05] border-cyan-500/30 text-cyan-300" : "bg-white/[0.02] border-white/10 text-white/50"
                    }`}
                    aria-label="Toggle microphone"
                  >
                    <span className="text-2xl">{micOn ? "🎤" : "🔇"}</span>
                    <span className="text-[11px] font-bold">{micOn ? t.micOn : "MIC OFF"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`w-[78px] h-[78px] rounded-2xl border transition-colors flex flex-col items-center justify-center gap-2 ${
                      cameraOn ? "bg-white/[0.05] border-cyan-500/30 text-cyan-300" : "bg-white/[0.02] border-white/10 text-white/50"
                    }`}
                    aria-label="Toggle camera"
                  >
                    <span className="text-2xl">{cameraOn ? "📷" : "🚫"}</span>
                    <span className="text-[11px] font-bold">{cameraOn ? t.camera : "CAMERA OFF"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleSpeaker}
                    className={`w-[78px] h-[78px] rounded-2xl border transition-colors flex flex-col items-center justify-center gap-2 ${
                      speakerOn ? "bg-white/[0.05] border-cyan-500/30 text-cyan-300" : "bg-white/[0.02] border-white/10 text-white/50"
                    }`}
                    aria-label="Toggle speaker"
                  >
                    <span className="text-2xl">{speakerOn ? "🔊" : "🔈"}</span>
                    <span className="text-[11px] font-bold">{t.speaker}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShareEnabled((v) => !v);
                      toast.success(shareEnabled ? "Share stopped (mock)." : "Sharing started (mock).");
                    }}
                    className={`w-[78px] h-[78px] rounded-2xl border transition-colors flex flex-col items-center justify-center gap-2 ${
                      shareEnabled ? "bg-purple-500/10 border-purple-500/30 text-purple-200" : "bg-white/[0.02] border-white/10 text-white/50"
                    }`}
                    aria-label="Share screen"
                  >
                    <span className="text-2xl">🔗</span>
                    <span className="text-[11px] font-bold">{t.share}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("chat")}
                    className={`w-[78px] h-[78px] rounded-2xl border transition-colors flex flex-col items-center justify-center gap-2 ${
                      activeTab === "chat" ? "bg-white/[0.05] border-cyan-500/30 text-cyan-300" : "bg-white/[0.02] border-white/10 text-white/50"
                    }`}
                    aria-label="Open chat tab"
                  >
                    <span className="text-2xl">💬</span>
                    <span className="text-[11px] font-bold">{t.chat}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("patient")}
                    className={`w-[78px] h-[78px] rounded-2xl border transition-colors flex flex-col items-center justify-center gap-2 ${
                      activeTab === "patient" ? "bg-white/[0.05] border-cyan-500/30 text-cyan-300" : "bg-white/[0.02] border-white/10 text-white/50"
                    }`}
                    aria-label="Open patient tab"
                  >
                    <span className="text-2xl">🧑‍⚕️</span>
                    <span className="text-[11px] font-bold">{t.patient}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("scribe");
                      toast.success("CC captions focused (mock).");
                    }}
                    className={`w-[78px] h-[78px] rounded-2xl border transition-colors flex flex-col items-center justify-center gap-2 ${
                      activeTab === "scribe"
                        ? "bg-white/[0.05] border-cyan-500/30 text-cyan-300"
                        : "bg-white/[0.02] border-white/10 text-white/50"
                    }`}
                    aria-label="Open CC captions"
                  >
                    <span className="text-2xl">📝</span>
                    <span className="text-[11px] font-bold">{t.ccCaptions}</span>
                  </button>

                  <button
                    type="button"
                    onClick={endCall}
                    className="w-[78px] h-[78px] rounded-2xl bg-red-600/20 border border-red-500/40 text-red-200 flex flex-col items-center justify-center gap-2 hover:bg-red-600/30 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.25)]"
                    aria-label="End call"
                  >
                    <span className="text-2xl">☎</span>
                    <span className="text-[11px] font-bold">{t.endCall}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScribeActive(true);
                      setActiveTab("scribe");
                      toast.success("Ambient scribe enabled (mock).");
                    }}
                    className={`w-[78px] h-[78px] rounded-2xl border transition-colors flex flex-col items-center justify-center gap-2 ${
                      scribeActive ? "bg-blue-500/10 border-blue-400/30 text-blue-200" : "bg-white/[0.02] border-white/10 text-white/50"
                    }`}
                    aria-label="Enable ambient scribe"
                  >
                    <span className="text-2xl">🎙️</span>
                    <span className="text-[11px] font-bold">{t.scribeBtn}</span>
                  </button>
                </div>
              </div>

           </motion.div>
         )}
      </div>
    </div>
  );
}
