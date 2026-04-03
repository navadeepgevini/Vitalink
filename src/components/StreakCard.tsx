"use client";

import { motion } from "framer-motion";
import { Check, CheckCircle2 } from "lucide-react";

export function StreakCard({ streakData, onCheckIn }: { streakData: any, onCheckIn: (data: any) => void }) {
  if (!streakData) return null;

  const logs = streakData.dailyLog || [];
  const today = new Date().toISOString().split('T')[0];
  const todayLog = logs.find((l: any) => l.date === today) || { medication: false, vitals: false, steps: false, water: false };

  const handleToggle = (field: string) => {
    onCheckIn({ username: streakData.username, [field]: !todayLog[field] });
  };

  const isComplete = todayLog.medication && todayLog.vitals && todayLog.steps && todayLog.water;

  return (
    <div className="bg-gradient-to-br from-[#1a1005] to-black border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
        {/* Streak Counter Ring */}
        <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(255,165,0,0.1)" strokeWidth="10" />
            <motion.circle 
              cx="80" cy="80" r="72" fill="none" 
              stroke="url(#gradient)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={452} 
              initial={{ strokeDashoffset: 452 }}
              animate={{ strokeDashoffset: 452 - (452 * (streakData.progress / 100)) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="text-4xl"
            >
              🔥
            </motion.div>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              {streakData.currentStreak}
            </div>
            <div className="text-xs text-orange-200/50 font-bold tracking-widest uppercase">Days</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Health Streak</h2>
              <p className="text-sm text-orange-200/60">
                {isComplete ? "Great job! You've completed your daily health goals." : "Complete today's checklist to maintain your streak!"}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-orange-400">{streakData.totalPoints} pts</div>
              <div className="text-xs text-white/40">Lifetime Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <ChecklistButton 
                label="Medication" icon="💊" active={todayLog.medication} 
                onClick={() => handleToggle('medication')} 
             />
             <ChecklistButton 
                label="Vitals Sync" icon="📈" active={todayLog.vitals} 
                onClick={() => handleToggle('vitals')} 
             />
             <ChecklistButton 
                label="8k Steps" icon="👟" active={todayLog.steps} 
                onClick={() => handleToggle('steps')} 
             />
             <ChecklistButton 
                label="2L Water" icon="💧" active={todayLog.water} 
                onClick={() => handleToggle('water')} 
             />
          </div>
        </div>
      </div>
      
      {/* Rewards Bar */}
      <div className="mt-8 pt-6 border-t border-orange-500/10 flex flex-wrap gap-4 justify-between relative z-10">
        {streakData.milestones?.map((m: any) => (
          <div key={m.days} className={`flex items-center gap-2 ${m.unlocked ? "opacity-100" : "opacity-40"}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${m.unlocked ? "bg-orange-500/20 border-orange-500/50" : "bg-white/5 border-white/10"}`}>
              {m.emoji}
            </span>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-white">{m.reward}</div>
              <div className="text-[10px] text-white/50">{m.days} Days {m.unlocked && "✓"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistButton({ label, icon, active, onClick }: { label: string, icon: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`relative p-4 rounded-2xl border text-left transition-all ${
        active 
          ? "bg-orange-500 flex-1 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
          : "bg-black/50 border-white/10 hover:bg-white/5"
      }`}
    >
      <div className="absolute top-3 right-3">
        {active ? <CheckCircle2 size={18} className="text-black" /> : <div className="w-4 h-4 rounded-full border border-white/20" />}
      </div>
      <div className={`text-2xl mb-2 ${active ? "opacity-90 grayscale-[0.5]" : "opacity-70 grayscale"}`}>{icon}</div>
      <div className={`text-xs font-bold ${active ? "text-black" : "text-white/60"}`}>{label}</div>
    </button>
  );
}
