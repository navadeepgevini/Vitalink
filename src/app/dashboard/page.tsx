"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { formatINR } from "@/lib/currency";
import { SkeletonDashboard, SkeletonStatCard, SkeletonCard } from "@/components/Skeleton";
import { EmergencySOS } from "@/components/EmergencySOS";
import { EmergencyTracking } from "@/components/EmergencyTracking";
import { StreakCard } from "@/components/StreakCard";
import { IntegrityBadge } from "@/components/IntegrityBadge";
import { useLanguage } from "@/context/LanguageContext";
import { Lang } from "@/lib/translations";

const Map = dynamic(() => import("../../components/Map"), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [realAppointments, setRealAppointments] = useState<any[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showZkpConsent, setShowZkpConsent] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [coffeeClaimed, setCoffeeClaimed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showBooking, setShowBooking] = useState(false);
  const [bookingType, setBookingType] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  // New Phase 2 States
  const [showEmergencySOS, setShowEmergencySOS] = useState(false);
  const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);
  const [emergencyDoctor, setEmergencyDoctor] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [streakData, setStreakData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // ─── Session check via JWT cookie & Fetch Data ──────────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) { router.push("/login"); return; }
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("vitalink_user", JSON.stringify(data.user));

        // Fetch appointments
        const aptsRes = await fetch(`/api/appointments?username=${data.user.username}&role=patient`);
        const aptsData = await aptsRes.json();
        setRealAppointments(aptsData.appointments || []);

        // Fetch wallet
        fetch(`/api/wallet?username=${data.user.username}`).then(r => r.json()).then(d => {
          if (d.balance) setWalletBalance(d.balance);
        });

        // Fetch streaks
        fetch(`/api/health/streak?username=${data.user.username}`).then(r => r.json()).then(d => {
          setStreakData(d);
        });

        // Fetch leaderboard
        fetch(`/api/health/leaderboard`).then(r => r.json()).then(d => {
          if (d.leaderboard) setLeaderboard(d.leaderboard);
        });

        setDataLoading(false);
      } catch {
        router.push("/login");
      } finally {
        setSessionLoading(false);
      }
    };
    checkSession();
  }, [router]);

  // Emergency Polling Effect
  useEffect(() => {
    if (!activeEmergencyId) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/emergency/${activeEmergencyId}`);
        const data = await res.json();
        if (data.status === 'accepted') {
          setEmergencyDoctor(data.acceptedDoctor);
          toast.success("Emergency accepted! Doctor on the way.");
          setShowEmergencySOS(false);
        } else if (data.status === 'declined_all') {
          toast.error("No doctors available near you.");
          setActiveEmergencyId(null);
          setShowEmergencySOS(false);
        }
      } catch (e) { console.error(e); }
    }, 2000);

    return () => clearInterval(timer);
  }, [activeEmergencyId]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("vitalink_user");
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const simulatePayment = () => {
    setShowPayment(true);
    setTimeout(() => {
      setShowPayment(false);
      setIsPaid(true);
      toast.success("Payment confirmed! Escrow secured.");
    }, 3000);
  };

  const confirmBooking = () => {
    setBookingConfirmed(true);
    toast.success("Appointment booked successfully!");
    setTimeout(() => {
      setShowBooking(false);
      setBookingConfirmed(false);
      setBookingType(null);
    }, 2000);
  };

  const claimCompensation = async (aptId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/appointments/${aptId}/claim-compensation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientUsername: user.username, delayMinutes: 15 }),
      });
      const data = await res.json();
      if (res.ok) {
        setWalletBalance(data.balance);
        setCoffeeClaimed(true);
        toast.success(data.message);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to claim voucher");
    }
  };

  const triggerEmergency = async (lat: number, lng: number, problem: string, bloodGroup: string, allergies: string[]) => {
    try {
      const res = await fetch("/api/emergency/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientUsername: user.username, patientName: user.fullName, lat, lng, problem, bloodGroup, allergies }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveEmergencyId(data.emergencyId);
        toast("Searching for nearest doctors...", { icon: "📡" });
      } else {
        toast.error("Failed to trigger SOS");
        setShowEmergencySOS(false);
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleHealthCheckIn = async (updateData: any) => {
    try {
      const res = await fetch("/api/health/streak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (res.ok) {
        setStreakData(data.streak); // Re-fetch complete data or use returned
        // Soft refresh for milestones
        fetch(`/api/health/streak?username=${user.username}`).then(r => r.json()).then(d => setStreakData(d));
      }
    } catch (e) {}
  };

  const dietPlan = [
    { meal: "Breakfast", time: "8:00 AM", items: "Oats porridge, 1 banana, green tea", calories: 320 },
    { meal: "Mid-Morning", time: "10:30 AM", items: "Mixed nuts (almonds, walnuts), 1 apple", calories: 180 },
    { meal: "Lunch", time: "1:00 PM", items: "Brown rice, grilled chicken, steamed broccoli", calories: 520 },
    { meal: "Snack", time: "4:00 PM", items: "Greek yogurt with berries", calories: 150 },
    { meal: "Dinner", time: "7:30 PM", items: "Quinoa salad, baked salmon, avocado", calories: 480 },
  ];

  // ─── Loading state ─────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-white/30 text-sm font-medium">Loading VitaLink...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-black/60 backdrop-blur-2xl p-6 hidden md:flex flex-col z-20">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center font-bold">V</div>
          <span className="text-xl font-bold tracking-tight">VitaLink</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          {[
            { label: t.overview, tab: "overview", icon: "📊" },
            { label: t.bookAppointment, tab: "book", icon: "📅" },
            { label: t.bookingHistory, tab: "history", icon: "📋" },
            { label: t.healthLedger, tab: "ledger", icon: "💊" },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              aria-label={`Navigate to ${item.label}`}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                activeTab === item.tab
                  ? "bg-white/10 text-cyan-400 border border-white/5"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}

          {/* Emergency SOS Button */}
          <div className="pt-4 mt-2 mb-4 relative">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            <button 
              onClick={() => setShowEmergencySOS(true)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/30 transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(220,38,38,0.15)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse hover:animate-none"
            >
              <span className="text-xl">🚨</span> {t.sosEmergency}
            </button>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-2">
            <Link href="/book" className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3 block" aria-label="Book appointment form">
              <span>📝</span> Book Now
            </Link>
            <Link href="/triage" className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3 block" aria-label="AI triage">
              <span>🤖</span> AI Triage
            </Link>
            <Link href="/room" className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3 block" aria-label="Virtual consultation room">
              <span>📹</span> Virtual Room
            </Link>
            <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3" aria-label="Sign out">
              <span>🚪</span> Sign Out
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto w-full relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none" />

        <header className="flex justify-between items-center mb-8 relative z-10 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isAnonymous ? "Patient 0x8F92..." : `${t.welcomeBack}, ${user?.fullName || "Patient"}`}
            </h1>
            <p className="text-white/40 text-sm mt-1">Your personal health dashboard</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Wallet Balance */}
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
               <span className="text-xl">💰</span>
               <span className="font-bold">{formatINR(walletBalance)}</span>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <span className="text-xs font-semibold text-white/70">{t.anonymousMode}</span>
              <button 
                onClick={() => {
                  if (!isAnonymous) {
                    setShowZkpConsent(true);
                  } else {
                    setIsAnonymous(false);
                    toast("Identity visible", { icon: "👤" });
                  }
                }}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isAnonymous ? "bg-cyan-500 shadow-[0_0_10px_#06b6d4]" : "bg-white/20"}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isAnonymous ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
        </header>

        {emergencyDoctor && (
          <div className="mb-6 relative z-10">
            <EmergencyTracking 
              alertId={activeEmergencyId!} 
              doctor={emergencyDoctor} 
              onComplete={() => {
                setActiveEmergencyId(null);
                setEmergencyDoctor(null);
                toast.success("Emergency handled. Consultation recorded.");
              }} 
            />
          </div>
        )}

        {/* ========== OVERVIEW TAB ========== */}
        {activeTab === "overview" && !emergencyDoctor && (
          dataLoading ? <SkeletonDashboard /> : (
          <div className="space-y-6 relative z-10">
            {/* Wait-Time Alert */}
            <AnimatePresence>
              {!coffeeClaimed && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden"
                >
                  <div className="flex-1">
                    <h4 className="text-orange-400 font-bold mb-1 flex items-center gap-2">⚠️ Wait-Time Alert</h4>
                    <p className="text-sm text-orange-200/80">Dr. Sharma is running 15 minutes late for your 4:00 PM slot.</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button className="px-4 py-2 border border-orange-500/30 text-orange-400 text-sm font-semibold rounded-xl hover:bg-orange-500/10">Reschedule</button>
                    <button onClick={() => claimCompensation('apt_123')} className="px-4 py-2 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                       Claim {formatINR(200)} Voucher ☕
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t.upcoming, value: Math.max(0, realAppointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length), accent: "text-cyan-400", sub: t.appointment },
                { label: t.completed, value: realAppointments.filter(a => a.status === 'Completed').length, accent: "text-emerald-400", sub: t.thisMonth },
                { label: t.prescriptions, value: "3", accent: "text-purple-400", sub: t.active },
                { label: t.healthScore, value: "87", accent: "text-yellow-400", sub: t.outOf100 },
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
                  <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

             {/* Next Session */}
             <div>
              <h3 className="text-lg font-bold mb-3">{t.upcomingAppointments}</h3>
              {realAppointments.length > 0 ? (
                <div className="space-y-3">
                  {realAppointments.filter(a => a.status === "Pending" || a.status === "Confirmed").slice(0, 1).map((apt) => (
                    <div key={apt.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-blue-500/20 border-2 border-blue-500/50 text-blue-400 flex items-center justify-center font-bold text-lg">
                            {apt.doctorName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-[#030303] rounded-full ${apt.status === "Confirmed" ? "bg-green-500" : "bg-orange-500"}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-lg">{apt.doctorName}</h4>
                            {/* Doctor Integrity Badge added here */}
                            <IntegrityBadge record={{ doctorUsername: apt.doctorUsername, score: 92, tier: 'Platinum', breakdown: { cancellationRate: 30, avgDelay: 17, patientNoShow: 18, rating: 18, prescriptionQuality: 9 }, calculatedAt: '' }} />
                          </div>
                          <p className="text-sm text-white/40 mb-1">{apt.type} • {apt.date}, {apt.time}</p>
                          <div className={`inline-flex py-0.5 px-2 rounded text-[10px] font-bold tracking-wider ${apt.status === "Confirmed" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-orange-500/10 border border-orange-500/20 text-orange-400"}`}>
                             {apt.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {apt.payment === "Pending" ? (
                          <button onClick={simulatePayment} className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors">
                            Pay & Confirm
                          </button>
                        ) : (
                          <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg">✓ {apt.payment}</div>
                        )}
                        <Link href={apt.payment !== "Pending" ? "/room" : "#"} onClick={(e) => { if (apt.payment === "Pending") { e.preventDefault(); toast.error("Please pay first!"); }}} className={`px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-bold rounded-xl ${apt.payment === "Pending" ? "opacity-40" : "hover:bg-cyan-500/20"}`}>
                          Join Call
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <p className="text-white/40 text-sm">No upcoming appointments. Start by booking one!</p>
                  <button onClick={() => setActiveTab("book")} className="mt-4 px-5 py-2 bg-cyan-500 text-black text-sm font-bold rounded-xl">Book Appointment</button>
                </div>
              )}
            </div>

            {/* Clinics Map */}
            <div>
              <h3 className="text-lg font-bold mb-3">{t.nearbyClinics}</h3>
              <Map />
            </div>
          </div>
          )
        )}

        {/* ========== BOOK APPOINTMENT TAB ========== */}
        {activeTab === "book" && (
          <div className="space-y-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold mb-1">Book an Appointment</h2>
              <p className="text-white/40 text-sm">Choose your preferred consultation type</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { type: "home", icon: "🏠", title: "Home Doctor Visit", desc: "A verified doctor visits your home for a thorough check-up", price: 899, time: "Within 4 hrs", color: "from-emerald-500/15 to-green-500/5", border: "border-emerald-500/30", accent: "text-emerald-400" },
                { type: "online", icon: "💻", title: "Online Consultation", desc: "Video call with a specialist from the comfort of your home", price: 299, time: "Within 30 min", color: "from-cyan-500/15 to-blue-500/5", border: "border-cyan-500/30", accent: "text-cyan-400" },
                { type: "clinic", icon: "🏥", title: "Clinic Visit", desc: "Book an in-person appointment at a nearby clinic", price: 499, time: "Next available slot", color: "from-purple-500/15 to-pink-500/5", border: "border-purple-500/30", accent: "text-purple-400" },
              ].map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => router.push("/book")}
                  className={`text-left p-6 rounded-2xl bg-gradient-to-b ${opt.color} border ${opt.border} hover:scale-[1.02] transition-all group`}
                >
                  <div className="text-4xl mb-4">{opt.icon}</div>
                  <h3 className={`text-lg font-bold mb-1 ${opt.accent}`}>{opt.title}</h3>
                  <p className="text-sm text-white/40 mb-4 leading-relaxed">{opt.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">{formatINR(opt.price)}</span>
                    <span className="text-xs text-white/30">{opt.time}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Available Doctors */}
            <div>
              <h3 className="text-lg font-bold mb-3">Available Doctors</h3>
              <div className="space-y-3">
                {[
                  { name: "Dr. Priya Sharma", score: 94, tier: "Platinum" as const, spec: "Cardiology", rating: "4.9", exp: "15 yrs", avail: "Today, 4:00 PM" },
                  { name: "Dr. Arun Kumar", score: 85, tier: "Gold" as const, spec: "General Medicine", rating: "4.8", exp: "12 yrs", avail: "Today, 5:30 PM" },
                  { name: "Dr. Meena Reddy", score: 65, tier: "Silver" as const, spec: "Dermatology", rating: "4.7", exp: "8 yrs", avail: "Tomorrow, 10:00 AM" },
                  { name: "Dr. James Thomas", score: 98, tier: "Platinum" as const, spec: "Orthopedics", rating: "4.9", exp: "20 yrs", avail: "Tomorrow, 2:00 PM" },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/50">{doc.name.charAt(4)}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{doc.name}</h4>
                          <IntegrityBadge record={{ doctorUsername: doc.name, score: doc.score, tier: doc.tier, breakdown: { cancellationRate: 28, avgDelay: 18, patientNoShow: 15, rating: 18, prescriptionQuality: 8 }, calculatedAt: '' }} />
                        </div>
                        <p className="text-xs text-white/40">{doc.spec} • {doc.exp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-sm text-yellow-400 font-semibold">★ {doc.rating}</p>
                        <p className="text-xs text-white/30">{doc.avail}</p>
                      </div>
                      <button onClick={() => { setBookingType("online"); setShowBooking(true); }} className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-lg hover:bg-cyan-500/20 transition-colors">
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== BOOKING HISTORY TAB ========== */}
        {activeTab === "history" && (
          <div className="space-y-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold mb-1">Booking History</h2>
              <p className="text-white/40 text-sm">Your past appointments and consultations</p>
            </div>

            <div className="space-y-3">
              {dataLoading ? (
                [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
              ) : realAppointments.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                  <h3 className="text-lg font-bold mb-1">No Bookings Yet</h3>
                  <p className="text-sm text-white/40 mb-4">Your consultation history will appear here.</p>
                  <button onClick={() => setActiveTab("book")} className="px-5 py-2 bg-cyan-500 text-black text-sm font-bold rounded-xl">Book Now</button>
                </div>
              ) : (
                realAppointments.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg ${
                        booking.type === "Online" || booking.type === "Virtual" ? "bg-cyan-500/20 text-cyan-400" : booking.type === "Home Visit" ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400"
                      }`}>
                        {booking.type === "Online" || booking.type === "Virtual" ? "💻" : booking.type === "Home Visit" ? "🏠" : "🏥"}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{booking.doctorName}</h4>
                        <p className="text-xs text-white/40">{booking.problem?.substring(0, 30)}... • {booking.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-white/40 hidden md:block">{booking.date}</p>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        booking.status === "Completed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
                        booking.status === "Cancelled" ? "bg-red-500/20 text-red-400 border border-red-500/20" :
                        "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                      }`}>
                        {booking.status.toLowerCase()}
                      </span>
                      <button className="px-3 py-1.5 bg-white/5 border border-white/10 text-xs font-semibold rounded-lg hover:bg-white/10 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========== HEALTH LEDGER TAB ========== */}
        {activeTab === "ledger" && (
          <div className="space-y-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold mb-1">Health Ledger</h2>
              <p className="text-white/40 text-sm">Your health statistics, streaks, and records</p>
            </div>

            {/* Streak Gamification Layer */}
            <StreakCard streakData={streakData} onCheckIn={handleHealthCheckIn} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leaderboard */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><span>🏆</span> Health Streak Leaderboard</h3>
                <div className="space-y-3">
                  {leaderboard.map((entry, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${i < 3 ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5 border-white/5"}`}>
                      <div className="flex items-center gap-4">
                        <div className={`font-black text-lg w-6 shrink-0 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-white/30"}`}>
                          #{entry.rank}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{entry.anonymousName}</p>
                          <p className="text-[10px] text-white/50">{entry.tier}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-orange-400">🔥 {entry.streak}</div>
                        <div className="text-xs text-white/30">{entry.points} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

               {/* Vitals Trends */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><span>📈</span> Health Trends (Last 30 Days)</h3>
                <div className="space-y-4">
                  {[
                    { label: "Resting Heart Rate", val: "72 bpm", trend: "↓ 3%", good: true, bar: 72 },
                    { label: "Blood Pressure", val: "120/80", trend: "Stable", good: true, bar: 85 },
                    { label: "Weight", val: "68.5 kg", trend: "↓ 0.5 kg", good: true, bar: 70 },
                    { label: "Steps Daily Avg", val: "6,842", trend: "↑ 12%", good: true, bar: 68 },
                    { label: "Water Intake", val: "2.1L", trend: "↓ 8%", good: false, bar: 52 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-white/60">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${item.good ? "text-emerald-400" : "text-orange-400"}`}>{item.trend}</span>
                          <span className="text-sm font-bold">{item.val}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.good ? "bg-gradient-to-r from-cyan-500 to-emerald-500" : "bg-gradient-to-r from-orange-500 to-red-500"}`} style={{ width: `${item.bar}%` }} />
                      </div>
                      {!item.good && (
                        <div className="mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between">
                          <p className="text-xs text-amber-300">⚠️ Your {item.label.toLowerCase()} has dropped {item.trend.replace("↓ ", "")} this week. Aim for 2.5L daily.</p>
                          <button className="text-xs text-amber-400 font-semibold hover:underline ml-2 shrink-0">Dismiss</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Diet Plan */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2"><span>🥗</span> Current Diet Plan</h3>
                <span className="text-xs text-white/30">Prescribed by Dr. Sharma • Mar 28</span>
              </div>
              <div className="space-y-3">
                {dietPlan.map((meal, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-right">
                        <p className="text-xs text-white/30">{meal.time}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{meal.meal}</h4>
                        <p className="text-xs text-white/40">{meal.items}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-cyan-400">{meal.calories} cal</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Emergency SOS Trigger Modal */}
      <AnimatePresence>
        {showEmergencySOS && (
          <EmergencySOS 
            onTrigger={triggerEmergency}
            onCancel={() => setShowEmergencySOS(false)}
          />
        )}
      </AnimatePresence>

      {/* ZKP Consent Modal */}
      <AnimatePresence>
        {showZkpConsent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0a0a0a] border border-cyan-500/30 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)]">
               <div className="p-6">
                 <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-xl mb-4">🕶️</div>
                 <h2 className="text-xl font-bold mb-2">Enable Anonymous Consult</h2>
                 <p className="text-sm text-white/60 mb-6">
                   Using <span className="text-cyan-400 font-bold">Zero-Knowledge Proofs (ZKP)</span>, we generate a cryptographic session token. The doctor will see your vitals and medical data for consultation, but your personal identity and PII will remain completely hidden.
                 </p>
                 <div className="space-y-3 mb-6 flex flex-col">
                   <div className="flex items-center gap-3 text-sm"><span className="text-emerald-400">✓</span> Medical History Shared</div>
                   <div className="flex items-center gap-3 text-sm"><span className="text-emerald-400">✓</span> Live Vitals Shared</div>
                   <div className="flex items-center gap-3 text-sm"><span className="text-red-400">✗</span> Name & Contact Hidden</div>
                   <div className="flex items-center gap-3 text-sm"><span className="text-red-400">✗</span> Profile Picture Hidden</div>
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => setShowZkpConsent(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition">Cancel</button>
                   <button onClick={() => { setIsAnonymous(true); setShowZkpConsent(false); toast.success("ZKP Anonymous Mode Enabled", { icon: "🔐" }); }} className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl font-black transition shadow-[0_0_15px_rgba(6,182,212,0.4)]">Generate Proof</button>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Modal & Razorpay Mock (unchanged) */}
      {/* ... keeping other modals ... */}
      <AnimatePresence>
        {showBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden">
              <div className="p-6">
                {!bookingConfirmed ? (
                  <>
                    <h3 className="text-xl font-bold mb-1">
                      {bookingType === "home" ? "🏠 Home Doctor Visit" : bookingType === "online" ? "💻 Online Consultation" : "🏥 Clinic Visit"}
                    </h3>
                    <p className="text-sm text-white/40 mb-6">Fill in the details to confirm your booking</p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-white/50 font-semibold uppercase mb-1.5 block">Select Doctor</label>
                        <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm appearance-none focus:outline-none focus:border-white/30">
                          <option>Dr. Priya Sharma — Cardiology</option>
                          <option>Dr. Arun Kumar — General Medicine</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-white/50 font-semibold uppercase mb-1.5 block">Preferred Date</label>
                        <input type="date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/30" />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 font-semibold uppercase mb-1.5 block">Time Slot</label>
                        <div className="grid grid-cols-3 gap-2">
                          {["10:00 AM", "2:00 PM", "4:00 PM"].map((t) => (
                            <button key={t} type="button" className="py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors">{t}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowBooking(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/10">Cancel</button>
                      <button onClick={confirmBooking} className="flex-1 py-3 bg-cyan-500 text-black rounded-xl text-sm font-bold hover:bg-cyan-400">Confirm</button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-xl font-bold mb-1">Booking Confirmed!</h3>
                    <p className="text-sm text-white/40">You will receive a confirmation shortly.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm p-6 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-6" />
              <p className="font-bold text-lg mb-1">Processing Payment...</p>
              <p className="text-sm text-white/40 text-center">Funds secured via Smart Escrow</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
