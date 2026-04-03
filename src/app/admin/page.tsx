"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatINR, formatINRCompact } from "@/lib/currency";
import { SkeletonStatCard, SkeletonTable } from "@/components/Skeleton";
import { IntegrityBadge } from "@/components/IntegrityBadge";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [realAppointments, setRealAppointments] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  // Phase 2 states
  const [integrityScores, setIntegrityScores] = useState<Record<string, any>>({});
  const [noShowStats, setNoShowStats] = useState({ avgScore: 0, highRiskCount: 0 });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) { router.push("/login"); return; }
        const data = await res.json();
        if (data.user.role !== "admin") { router.push("/login"); return; }
        localStorage.setItem("vitalink_user", JSON.stringify(data.user));
      } catch { router.push("/login"); return; }
      finally { setSessionLoading(false); }

      try {
        const [aRes, uRes] = await Promise.all([
          fetch("/api/appointments?role=admin"),
          fetch("/api/users")
        ]);
        const aData = await aRes.json();
        const uData = await uRes.json();
        const appointments = aData.appointments || [];
        const users = uData.users || [];
        
        setRealAppointments(appointments);
        setRealUsers(users);

        // Fetch Integrity Scores for all doctors
        const docs = users.filter((u: any) => u.role === "doctor");
        const scores: Record<string, any> = {};
        for (const doc of docs) {
          try {
            const res = await fetch(`/api/doctors/${doc.username}/integrity`);
            scores[doc.username] = await res.json();
          } catch {}
        }
        setIntegrityScores(scores);

        // Mock No-show Analytics calculation
        setNoShowStats({ avgScore: 42, highRiskCount: Math.max(0, Math.floor(appointments.length * 0.15)) });

      } catch { /* fallback */ }
      finally { setDataLoading(false); }
    };
    checkSession();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("vitalink_user");
      toast.success("Signed out");
      router.push("/login");
    } catch { toast.error("Failed to sign out"); }
  };

  const users = realUsers.filter(u => u.role === "patient");
  const doctors = realUsers.filter(u => u.role === "doctor");

  const totalRevenue = realAppointments.reduce((acc, curr) => acc + (curr.type === "Online" || curr.type === "Virtual" ? 299 : curr.type === "Home Visit" ? 899 : 499), 0);
  const activeDoctorCount = doctors.length;
  const appointmentsToday = realAppointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length;

  const adminReports = [
    { id: 1, title: "Monthly Revenue Report", date: "Apr 2026", type: "Financial", status: "ready" },
    { id: 2, title: "ZKP Anonymous Consult Logs", date: "Q1 2026", type: "Compliance", status: "ready" },
    { id: 3, title: "Doctor Performance & Integrity", date: "Mar 2026", type: "Performance", status: "ready" },
    { id: 4, title: "No-Show ML Predictor Accuracy", date: "Mar 2026", type: "Analytics", status: "processing" },
    { id: 5, title: "Wait-Time Compensation Payouts", date: "Q1 2026", type: "Financial", status: "ready" },
  ];

  const filteredUsers = users.filter(u => u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDoctors = doctors.filter(d => d.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-white/30 text-sm font-medium">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center font-bold text-lg">V</div>
          <span className="text-xl font-bold">VitaLink</span>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-semibold border border-purple-500/20">Admin</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={handleSignOut} className="text-sm text-white/50 hover:text-white transition-colors" aria-label="Sign out">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Admin Console</h1>
            <p className="text-white/40 text-sm">Platform management and analytics</p>
          </div>
          {(activeTab === "users" || activeTab === "doctors") && (
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${activeTab}...`} aria-label={`Search ${activeTab}`}
              className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 w-72" />
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit" role="tablist">
          {["overview", "users", "doctors", "reports"].map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearchQuery(""); }} role="tab" aria-selected={activeTab === tab}
              className={`px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>{tab}</button>
          ))}
        </div>

        {/* ========== OVERVIEW TAB ========== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {dataLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Users", value: realUsers.length.toString(), change: "+12%", accent: "text-cyan-400" },
                    { label: "Active Doctors", value: activeDoctorCount.toString(), change: "+5%", accent: "text-emerald-400" },
                    { label: "Appointments Today", value: appointmentsToday.toString(), change: "+18%", accent: "text-blue-400" },
                    { label: "Revenue", value: formatINRCompact(totalRevenue), change: "+22%", accent: "text-purple-400" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
                      <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
                        <span className="text-xs text-emerald-400">{stat.change}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Phase 2: Analytics Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6">
                    <h3 className="font-bold flex items-center gap-2 mb-4 text-amber-400"><span>🤖</span> AI No-Show Predictor</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                        <span className="text-sm font-medium">Avg Risk Score</span>
                        <span className="text-xl font-bold text-amber-400">{noShowStats.avgScore}</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                        <span className="text-sm font-medium">Auto-Interventions</span>
                        <span className="text-xl font-bold text-emerald-400">Active</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                        <span className="text-sm font-medium">High Risk Patients</span>
                        <span className="text-xl font-bold text-red-400">{noShowStats.highRiskCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold mb-4">Platform Health & Gamification</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                          <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-wider">Health Streaks</p>
                          <div className="text-2xl font-black mb-1">1,204 Active</div>
                          <p className="text-xs text-white/40">Users completed daily goals today</p>
                       </div>
                       <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                          <p className="text-xs text-cyan-400 font-bold mb-1 uppercase tracking-wider">ZKP Anonymous Consults</p>
                          <div className="text-2xl font-black mb-1">14%</div>
                          <p className="text-xs text-white/40">Of total consultations this week</p>
                       </div>
                       <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                          <p className="text-xs text-orange-400 font-bold mb-1 uppercase tracking-wider">Wait-Time Compensation</p>
                          <div className="text-2xl font-black mb-1">₹4,200 Paid</div>
                          <p className="text-xs text-white/40">From delayed doctor schedules</p>
                       </div>
                       <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-red-400 font-bold mb-1 uppercase tracking-wider">Emergency SOS</p>
                            <div className="text-2xl font-black mb-1">4 Routed</div>
                            <p className="text-xs text-white/40">Geo-proximity handled today</p>
                          </div>
                          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 border border-red-500/30">🚨</div>
                       </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========== USERS TAB ========== */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/40">{filteredUsers.length} users found</p>
            </div>
            {dataLoading ? <SkeletonTable rows={5} /> : (
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-4 text-xs text-white/40 font-semibold uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-4 text-xs text-white/40 font-semibold uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="text-left px-6 py-4 text-xs text-white/40 font-semibold uppercase tracking-wider hidden md:table-cell">Joined</th>
                    <th className="text-left px-6 py-4 text-xs text-white/40 font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs text-white/40 font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-white/40 text-sm">No patients found</td></tr>
                  ) : filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center text-sm font-bold text-cyan-400">{user.fullName?.charAt(0)}</div>
                          <span className="text-sm font-medium">{user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/40 hidden md:table-cell">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-white/40 hidden md:table-cell">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400">active</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 bg-white/5 border border-white/10 text-xs font-semibold rounded-lg hover:bg-white/10" aria-label={`View ${user.fullName}`}>View</button>
                          <button className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20" aria-label={`Suspend ${user.fullName}`}>Suspend</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* ========== DOCTORS TAB ========== */}
        {activeTab === "doctors" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/40">{filteredDoctors.length} doctors found</p>
            </div>
            {dataLoading ? [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2"><div className="h-4 bg-white/5 rounded w-1/3" /><div className="h-3 bg-white/5 rounded w-1/4" /></div>
                </div>
              </div>
            )) : (
            <div className="space-y-3">
              {filteredDoctors.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                  <h3 className="text-lg font-bold mb-1">No Doctors Registered</h3>
                  <p className="text-sm text-white/40">Doctors will appear here after registration.</p>
                </div>
              ) : filteredDoctors.map((doc) => (
                <div key={doc.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors relative overflow-hidden">
                  {/* Platinum Glow Effect */}
                  {integrityScores[doc.username]?.tier === 'Platinum' && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />
                  )}
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-lg border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        {doc.fullName?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">{doc.fullName}</h4>
                          {integrityScores[doc.username] ? (
                            <IntegrityBadge record={integrityScores[doc.username]} />
                          ) : (
                            <IntegrityBadge record={{ doctorUsername: doc.username, score: 85, tier: 'Gold', breakdown: { cancellationRate: 20, avgDelay: 17, patientNoShow: 18, rating: 20, prescriptionQuality: 10 }, calculatedAt: '' }} />
                          )}
                        </div>
                        <p className="text-sm text-white/40">{doc.specialty || "General"} • Joined {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "—"}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">active</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/5 relative z-10">
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 text-center">
                      <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1">Appointments</p>
                      <p className="text-lg font-black text-white">{realAppointments.filter(a => a.doctorUsername === doc.username).length}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 text-center">
                      <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1">Total Revenue</p>
                      <p className="text-lg font-black text-emerald-400">{formatINRCompact(realAppointments.filter(a => a.doctorUsername === doc.username && ['Online','Virtual','Home Visit'].includes(a.type)).reduce((acc, curr) => acc + (curr.type === 'Home Visit' ? 899 : 299), 0))}</p>
                    </div>
                    <div className="col-span-2 bg-black/40 rounded-xl p-3 border border-white/5 flex items-center justify-between px-5">
                       <span className="text-sm font-bold opacity-50">Score Breakdown</span>
                       <div className="flex gap-4 text-xs font-mono">
                         <div className="flex flex-col items-center">
                           <span className="text-white/40 mb-1 leading-none text-[9px] uppercase tracking-wider">Cancel</span>
                           <span className="text-emerald-400">{integrityScores[doc.username]?.breakdown.cancellationRate || 30}</span>
                         </div>
                         <div className="flex flex-col items-center">
                           <span className="text-white/40 mb-1 leading-none text-[9px] uppercase tracking-wider">Delay</span>
                           <span className="text-emerald-400">{integrityScores[doc.username]?.breakdown.avgDelay || 20}</span>
                         </div>
                         <div className="flex flex-col items-center">
                           <span className="text-white/40 mb-1 leading-none text-[9px] uppercase tracking-wider">Rating</span>
                           <span className="text-yellow-400">{integrityScores[doc.username]?.breakdown.rating || 20}</span>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ========== REPORTS TAB ========== */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { label: "Total Revenue", value: formatINRCompact(1870000), period: "This Quarter", accent: "text-emerald-400" },
                { label: "New Users", value: "3,420", period: "This Month", accent: "text-cyan-400" },
                { label: "Avg Rating", value: "4.82", period: "All Doctors", accent: "text-yellow-400" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                  <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{stat.period}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {adminReports.map((report) => (
                <div key={report.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg ${
                      report.type === "Financial" ? "bg-emerald-500/20" : report.type === "Analytics" ? "bg-blue-500/20" : report.type === "Performance" ? "bg-purple-500/20" : report.type === "Compliance" ? "bg-orange-500/20" : "bg-cyan-500/20"
                    }`}>
                      {report.type === "Financial" ? "💰" : report.type === "Analytics" ? "📊" : report.type === "Performance" ? "⭐" : report.type === "Compliance" ? "🛡️" : "💬"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{report.title}</h4>
                      <p className="text-xs text-white/40">{report.type} • {report.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      report.status === "ready" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-orange-500/20 text-orange-400 border border-orange-500/20"
                    }`}>{report.status}</span>
                    <button className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                      report.status === "ready" ? "bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20" : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                    }`} aria-label={`Download ${report.title}`}>
                      {report.status === "ready" ? "Download" : "Processing..."}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
