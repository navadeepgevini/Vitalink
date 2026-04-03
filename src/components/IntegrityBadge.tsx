"use client";

export interface IntegrityRecord {
  doctorUsername: string;
  score: number;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  breakdown: {
    cancellationRate: number;
    avgDelay: number;
    patientNoShow: number;
    rating: number;
    prescriptionQuality: number;
  };
  calculatedAt: string;
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function getTierColor(tier: string) {
  switch (tier) {
    case 'Platinum': return 'from-cyan-400 to-blue-500';
    case 'Gold': return 'from-yellow-400 to-amber-500';
    case 'Silver': return 'from-slate-300 to-slate-400';
    case 'Bronze': return 'from-orange-700 to-amber-800';
    default: return 'from-gray-500 to-gray-600';
  }
}

export function getTierEmoji(tier: string) {
  switch (tier) {
    case 'Platinum': return '💎';
    case 'Gold': return '👑';
    case 'Silver': return '⚔️';
    case 'Bronze': return '🛡️';
    default: return '✅';
  }
}

export function IntegrityBadge({ record }: { record: IntegrityRecord }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <div className={`px-3 py-1 text-xs font-bold rounded-full border bg-gradient-to-r text-white flex items-center gap-1.5 cursor-help ${getTierColor(record.tier)} border-white/20 shadow-lg`}>
        <span>{getTierEmoji(record.tier)}</span>
        <span>{record.tier}</span>
        <span className="opacity-70 ml-1">{record.score}</span>
      </div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl z-50 pointer-events-none"
          >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
              <span className="font-bold text-sm flex items-center gap-2">Integrity Score</span>
              <span className="text-xl font-black text-cyan-400">{record.score}<span className="text-xs text-white/50">/100</span></span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Reliability (Cancellations)</span>
                <span className="font-semibold text-emerald-400">{record.breakdown.cancellationRate}/30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Punctuality (Delay)</span>
                <span className="font-semibold text-emerald-400">{record.breakdown.avgDelay}/20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Patient Attendance</span>
                <span className="font-semibold text-blue-400">{record.breakdown.patientNoShow}/20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Patient Ratings</span>
                <span className="font-semibold text-amber-400">{record.breakdown.rating}/20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Care Quality</span>
                <span className="font-semibold text-purple-400">{record.breakdown.prescriptionQuality}/10</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 text-center text-[10px] text-white/40 italic">
              Updated weekly based on platform metrics
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
