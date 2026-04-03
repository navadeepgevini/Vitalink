"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Props {
  onTrigger: (lat: number, lng: number, problem: string, bloodGroup: string, allergies: string[]) => void;
  onCancel: () => void;
}

export function EmergencySOS({ onTrigger, onCancel }: Props) {
  const [step, setStep] = useState<"consent" | "details" | "locating" | "ready">("consent");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [problem, setProblem] = useState("");
  const [bloodGroup, setBloodGroup] = useState("Unknown");
  const [allergies, setAllergies] = useState("");

  const requestLocation = () => {
    setStep("locating");
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setStep("consent");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStep("details");
      },
      (err) => {
        toast.error("Unable to retrieve your location. Emergency requires GPS.");
        setStep("consent");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleTrigger = () => {
    if (!location) return;
    const allergyList = allergies.split(",").map(a => a.trim()).filter(Boolean);
    onTrigger(location.lat, location.lng, problem || "Emergency - Details pending", bloodGroup, allergyList);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[#1a0505] border border-red-500/50 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.3)]"
      >
        <div className="p-6 relative">
          {/* Pulsing red background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 blur-3xl rounded-full pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/20 blur-3xl rounded-full pointer-events-none animate-pulse" />

          {step === "consent" && (
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(220,38,38,0.6)]">
                <span className="text-4xl text-white">🚨</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Emergency SOS</h2>
              <p className="text-red-200/80 mb-8 text-sm">
                This will alert all VitaLink doctors within a 5km radius. They will receive your live GPS location and vitals immediately.
              </p>
              
              <div className="space-y-4 bg-red-950/40 p-4 rounded-xl border border-red-500/20 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">📍</div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-red-100">GPS Required</p>
                    <p className="text-xs text-red-300">We need your exact location to route the nearest doctor.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-white/70 hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={requestLocation} className="flex-1 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-black text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">Enable GPS & Continue</button>
              </div>
            </div>
          )}

          {step === "locating" && (
            <div className="text-center py-12 relative z-10">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-2 bg-red-500 rounded-full animate-ping opacity-40" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl">📡</div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Acquiring Location</h2>
              <p className="text-red-200/60 text-sm">Please allow GPS access when prompted...</p>
            </div>
          )}

          {step === "details" && (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="animate-pulse text-red-500">●</span> Emergency Details</h2>
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1">
                  <span>✓</span> GPS Locked
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-red-300 uppercase mb-1.5 block">What is the emergency? (Optional)</label>
                  <input 
                    value={problem} onChange={e => setProblem(e.target.value)}
                    placeholder="e.g., Chest pain, difficulty breathing..." 
                    className="w-full px-4 py-3 bg-red-950/40 border border-red-500/30 rounded-xl text-white placeholder-red-500/30 focus:outline-none focus:border-red-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-red-300 uppercase mb-1.5 block">Blood Group</label>
                    <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full px-4 py-3 bg-red-950/40 border border-red-500/30 rounded-xl text-white appearance-none focus:outline-none focus:border-red-400">
                      <option>Unknown</option><option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-red-300 uppercase mb-1.5 block">Vitals (Live)</label>
                    <div className="w-full px-4 py-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm font-mono flex items-center justify-between">
                      <span>HR: 110</span>
                      <span className="text-red-500 animate-pulse">❤️</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-red-300 uppercase mb-1.5 block">Known Allergies</label>
                  <input 
                    value={allergies} onChange={e => setAllergies(e.target.value)}
                    placeholder="e.g., Penicillin, Peanuts (comma separated)" 
                    className="w-full px-4 py-3 bg-red-950/40 border border-red-500/30 rounded-xl text-white placeholder-red-500/30 focus:outline-none focus:border-red-400"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-white/70 hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={handleTrigger} className="flex-[2] py-4 bg-red-600 hover:bg-red-500 rounded-xl font-black text-white uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center gap-2">
                  <span>🚨</span> Trigger Alarm
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
