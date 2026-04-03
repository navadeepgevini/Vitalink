"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/currency";

export function EmergencyAlertDoctor({ 
  alert, 
  onAccept, 
  onDecline,
  autoDeclineSecs = 60
}: { 
  alert: any; 
  onAccept: () => void; 
  onDecline: () => void;
  autoDeclineSecs?: number;
}) {
  const [timeLeft, setTimeLeft] = useState(autoDeclineSecs);

  // Play browser notification sound
  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.setValueAtTime(0, audioCtx.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.4);
      oscillator.frequency.setValueAtTime(0, audioCtx.currentTime + 0.6);
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.warn("Audio playback not supported");
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onDecline]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black pointer-events-auto flex flex-col overflow-hidden">
      {/* Intense pulsing border */}
      <div className="absolute inset-0 border-[8px] border-red-600 animate-[borderFlash_1s_ease-in-out_infinite] z-50 pointer-events-none" />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes borderFlash {
          0% { border-color: rgba(220, 38, 38, 1); }
          50% { border-color: rgba(220, 38, 38, 0.2); }
          100% { border-color: rgba(220, 38, 38, 1); }
        }
      `}} />

      {/* Countdown Bar */}
      <div className="w-full h-2 bg-red-950">
        <motion.div 
          className="h-full bg-gradient-to-r from-red-500 to-orange-500"
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / autoDeclineSecs) * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black p-6 md:p-12 relative flex flex-col justify-center items-center">
        
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-red-600 font-bold uppercase tracking-[0.2em] text-white text-sm rounded-full mb-6 animate-pulse">
            🚨 Incoming Emergency
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4">{alert.distance} km away</h1>
          <p className="text-xl text-red-300 font-medium tracking-wide">Est. Drive Time: <span className="text-white font-bold">{Math.round(alert.distance * 3 + 2)} minutes</span></p>
        </div>

        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 relative z-10">
          
          {/* Patient Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-6">Patient Details</h2>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-2xl border border-red-500/40 flex items-center justify-center flex-shrink-0">
                 <span className="text-4xl text-red-500">👤</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">{alert.patientName}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-red-950 border border-red-500/30 text-red-400 rounded-lg text-sm font-bold shadow-[0_0_10px_rgba(220,38,38,0.2)]">Blood: {alert.bloodGroup}</span>
                  {alert.allergies?.map((a: string) => (
                    <span key={a} className="px-3 py-1 bg-orange-950 border border-orange-500/30 text-orange-400 rounded-lg text-sm font-bold">⚠️ Allergy: {a}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-6">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Reported Problem</h4>
              <p className="text-lg text-white font-medium leading-relaxed">{alert.problem}</p>
            </div>
          </div>

          {/* Vitals & Action */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex-1">
              <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-6">Live Vitals Snapshot</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4">
                  <span className="text-xs text-white/50 font-bold uppercase block mb-1">Heart Rate ❤️</span>
                  <div className="text-3xl font-black text-red-400 font-mono">{alert.vitals.heartRate} <span className="text-sm text-white/30 font-sans">bpm</span></div>
                </div>
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-4">
                  <span className="text-xs text-white/50 font-bold uppercase block mb-1">Blood Pressure 🩸</span>
                  <div className="text-3xl font-black text-blue-400 font-mono">{alert.vitals.bp}</div>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4">
                  <span className="text-xs text-white/50 font-bold uppercase block mb-1">SpO2 🫁</span>
                  <div className="text-3xl font-black text-emerald-400 font-mono">{alert.vitals.spo2}%</div>
                </div>
                <div className="bg-orange-950/20 border border-orange-500/20 rounded-2xl p-4">
                  <span className="text-xs text-white/50 font-bold uppercase block mb-1">Temp 🌡️</span>
                  <div className="text-3xl font-black text-orange-400 font-mono">{alert.vitals.temp}°C</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button onClick={onDecline} className="col-span-1 p-6 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-3xl font-bold transition-colors">
                Decline<br/><span className="text-xs font-normal">Next Doctor</span>
              </button>
              <button 
                onClick={onAccept} 
                className="col-span-2 p-6 bg-emerald-500 hover:bg-emerald-400 text-black rounded-3xl font-black text-2xl uppercase tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center"
              >
                <span>Accept SOS</span>
                <span className="text-sm font-semibold opacity-70 mt-1 flex items-center gap-2">
                  <span>Starts Navigation</span>
                  <span className="text-black inline-block px-2 py-0.5 bg-black/10 rounded-md text-xs">{timeLeft}s remaining</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
