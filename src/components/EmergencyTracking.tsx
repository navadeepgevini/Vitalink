"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function EmergencyTracking({ 
  alertId, 
  doctor, 
  onComplete 
}: { 
  alertId: string; 
  doctor: any; 
  onComplete: () => void;
}) {
  const [eta, setEta] = useState(doctor.eta);
  const [distance, setDistance] = useState(doctor.distance);

  // Simulate doctor moving closer over time
  useEffect(() => {
    if (eta <= 0) {
      setTimeout(onComplete, 2000);
      return;
    }
    const timer = setInterval(() => {
      setEta((prev: number) => Math.max(0, prev - 1));
      setDistance((prev: number) => Math.max(0, +(prev - (doctor.distance / doctor.eta)).toFixed(2)));
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [eta, doctor.distance, doctor.eta, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.15)] relative"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
          <h2 className="text-lg font-bold text-emerald-400 tracking-wider uppercase">SOS Accepted — Doctor on the way</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Radar / Distance Visualizer */}
          <div className="relative w-48 h-48 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-950/20 overflow-hidden">
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.4)_360deg)] animate-[spin_3s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full z-10 shadow-[0_0_10px_white]" />
            {/* Simulating Doctor dot moving closer */}
            <motion.div 
              className="absolute w-6 h-6 bg-emerald-500 rounded-full z-20 shadow-[0_0_15px_#10b981] flex items-center justify-center text-[10px]"
              animate={{ 
                x: distance > 0 ? (distance * 20) * Math.cos(Date.now()) : 0, 
                y: distance > 0 ? (distance * 20) * Math.sin(Date.now()) : 0 
              }}
              transition={{ duration: 1 }}
            >
              🚗
            </motion.div>
            {/* Grid concentric circles */}
            <div className="absolute inset-[15%] rounded-full border border-emerald-500/10" />
            <div className="absolute inset-[35%] rounded-full border border-emerald-500/10" />
            <div className="absolute inset-[65%] rounded-full border border-emerald-500/10" />
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-4xl font-black text-white mb-2">{eta} <span className="text-xl text-white/50 font-normal">min ETA</span></h3>
              <p className="text-emerald-400 font-semibold">{distance.toFixed(1)} km away • Approaching your location</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl border border-blue-500/30 flex items-center justify-center text-2xl">
                👨‍⚕️
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white mb-1">{doctor.fullName}</h4>
                <p className="text-sm text-white/50">{doctor.specialty} • Emergency Responder</p>
              </div>
              <div className="hidden md:flex gap-2">
                <button className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">💬</button>
                <button className="w-12 h-12 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center transition-colors">📞</button>
              </div>
            </div>
            
            {/* Mobile actions */}
            <div className="flex md:hidden gap-3">
              <button className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">Message</button>
              <button className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold transition-colors">Call Doctor</button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-sm">
          <span className="text-white/40">Emergency Case #{alertId.replace("emer_", "").substring(0, 8)}</span>
          <span className="text-white/60 font-medium">Fee: <span className="line-through mr-1 opacity-50">₹1,999</span> <span className="text-emerald-400 font-bold uppercase">Waived</span></span>
        </div>
      </div>
    </motion.div>
  );
}
