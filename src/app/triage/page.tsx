"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type StoredMessage = { id: number; text: string; sender: "bot" | "user"; isRich?: boolean; rawData?: any };
type DisplayMessage = { id: number; text: string | React.ReactNode; sender: "bot" | "user" };

// Reconstruct rich bot messages from stored data
function hydrateMessage(msg: StoredMessage): DisplayMessage {
  if (!msg.isRich || !msg.rawData) return { id: msg.id, text: msg.text, sender: msg.sender };

  const data = msg.rawData;
  if (data.is_emergency) {
    return {
      id: msg.id,
      sender: "bot",
      text: (
        <div className="space-y-4">
          <div className="px-3 py-2 bg-red-500/20 text-red-100 border border-red-500/50 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="animate-pulse">🚨</span> Emergency Detected
          </div>
          <p className="font-semibold text-red-50 leading-relaxed">{data.message_to_patient}</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold rounded-lg">Recommended: {data.specialty_match}</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/60 text-xs font-semibold rounded-lg">Priority: Urgent</span>
          </div>
          <Link href="/room" className="block text-center w-full mt-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">
            Connect to Doctor Now
          </Link>
        </div>
      ),
    };
  } else {
    return {
      id: msg.id,
      sender: "bot",
      text: (
        <div className="space-y-4">
          <p className="leading-relaxed">{data.message_to_patient}</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold rounded-lg">Recommended: {data.specialty_match}</span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 text-xs font-semibold rounded-lg">Priority: Routine</span>
          </div>
          <p className="text-sm text-white/50">Would you like to schedule a consultation with a {data.specialty_match} specialist?</p>
          <div className="flex gap-3">
            <Link href="/dashboard" className="px-6 py-2.5 bg-cyan-500 text-black text-sm font-bold rounded-xl hover:bg-cyan-400 transition-colors">
              Book Appointment
            </Link>
            <Link href="/dashboard" className="px-6 py-2.5 bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors">
              Return to Dashboard
            </Link>
          </div>
        </div>
      ),
    };
  }
}

export default function TriagePage() {
  const [storedMessages, setStoredMessages] = useState<StoredMessage[]>([
    { id: 1, text: "Hello. I am the VitaLink Health Intelligence. Describe your symptoms naturally, and I will recommend the right specialist for you.", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCodeRed, setIsCodeRed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── BUG-04: Hydrate from localStorage ──────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vitalink_triage_session");
      if (saved) {
        const parsed: StoredMessage[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setStoredMessages(parsed);
          // Check if any message was emergency
          const hasEmergency = parsed.some(m => m.rawData?.is_emergency);
          setIsCodeRed(hasEmergency);
        }
      }
    } catch { /* ignore corrupted data */ }
  }, []);

  // ─── Save to localStorage on every change ──────────
  useEffect(() => {
    if (storedMessages.length > 1) {
      localStorage.setItem("vitalink_triage_session", JSON.stringify(storedMessages));
    }
  }, [storedMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [storedMessages, loading]);

  // Hydrate messages for display
  const displayMessages: DisplayMessage[] = storedMessages.map(hydrateMessage);

  const clearSession = () => {
    localStorage.removeItem("vitalink_triage_session");
    setStoredMessages([
      { id: Date.now(), text: "Session cleared. How can I help you today?", sender: "bot" }
    ]);
    setIsCodeRed(false);
    toast.success("Triage session cleared");
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userText = input;
    const newMsg: StoredMessage = { id: Date.now(), text: userText, sender: "user" };
    setStoredMessages(prev => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch('/api/triage', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ prompt: userText })
      });

      const data = await response.json();
      setLoading(false);

      if (data.error) {
        setStoredMessages(prev => [...prev, { id: Date.now()+1, text: `API Error: ${data.error}${data.detail ? ' — ' + data.detail : ''}`, sender: "bot" }]);
        toast.error("Triage engine error");
        return;
      }

      const isEmergency = data.is_emergency || (data.sentiment && (data.sentiment.toLowerCase() === "panicked" || data.sentiment.toLowerCase() === "severe"));

      if (isEmergency) {
        setIsCodeRed(true);
      } else {
        setIsCodeRed(false);
      }

      const botMsg: StoredMessage = {
        id: Date.now() + 1,
        text: data.message_to_patient,
        sender: "bot",
        isRich: true,
        rawData: data,
      };
      setStoredMessages(prev => [...prev, botMsg]);

    } catch {
      setLoading(false);
      setStoredMessages(prev => [...prev, { id: Date.now()+1, text: "Triage Engine Error. Please try again.", sender: "bot" }]);
      toast.error("Network error");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center pt-8 p-4 transition-colors duration-1000 relative overflow-hidden ${isCodeRed ? "bg-[#1a0505]" : "bg-black"}`}>
      
      {/* Background gradients */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isCodeRed ? "opacity-100" : "opacity-0"}`}>
         <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black -z-10" />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${!isCodeRed ? "opacity-100" : "opacity-0"}`}>
         <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black -z-10" />
      </div>

      <div className="w-full max-w-3xl flex justify-between items-center mb-6 px-4 z-10">
         <Link href="/dashboard" className="text-white/50 hover:text-white font-medium" aria-label="Back to dashboard">← Dashboard</Link>
         
         <div className="flex items-center gap-3">
           {storedMessages.length > 1 && (
             <button onClick={clearSession} className="px-3 py-1.5 text-xs font-semibold text-white/40 hover:text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" aria-label="Clear triage session">
               Clear Session
             </button>
           )}
           <div className={`px-4 py-1.5 text-xs font-bold rounded-full border flex items-center gap-2 transition-colors duration-500 ${isCodeRed ? "bg-red-500/20 text-red-500 border-red-500/30" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isCodeRed ? "bg-red-500" : "bg-cyan-500"}`}></span>
              VitaLink AI Active
           </div>
         </div>
      </div>

      <div className={`w-full max-w-3xl flex-1 bg-white/5 border rounded-3xl backdrop-blur-2xl flex flex-col overflow-hidden mb-8 shadow-2xl transition-all duration-500 z-10 ${isCodeRed ? "border-red-500/40 shadow-[0_0_50px_rgba(220,38,38,0.15)]" : "border-white/10"}`}>
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {displayMessages.map(msg => (
             <motion.div 
               key={msg.id}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
             >
                <div className={`max-w-[85%] rounded-2xl p-5 ${msg.sender === "user" ? "bg-white/10 text-white rounded-br-none border border-white/5" : "bg-black/60 border border-white/5 rounded-bl-none leading-relaxed text-white/90 shadow-lg"}`}>
                   {msg.text}
                </div>
             </motion.div>
          ))}
          {loading && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="flex justify-start"
             >
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5 rounded-bl-none flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${isCodeRed ? "bg-red-400" : "bg-cyan-400"}`}></div>
                   <div className={`w-2 h-2 rounded-full animate-pulse ${isCodeRed ? "bg-red-400" : "bg-cyan-400"}`} style={{ animationDelay: "0.2s" }}></div>
                   <div className={`w-2 h-2 rounded-full animate-pulse ${isCodeRed ? "bg-red-400" : "bg-cyan-400"}`} style={{ animationDelay: "0.4s" }}></div>
                </div>
             </motion.div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/40">
          <div className="relative flex items-center">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="e.g. 'My kid has a high fever and I'm panicking!'"
              aria-label="Describe your symptoms"
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors pr-24 text-white"
            />
            <button 
              onClick={handleSend}
              aria-label="Analyze symptoms"
              className={`absolute right-2 px-6 py-2 font-bold rounded-lg transition-colors ${isCodeRed ? "bg-red-600 hover:bg-red-500 text-white" : "bg-white text-black hover:bg-gray-200"}`}
            >
              Analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
