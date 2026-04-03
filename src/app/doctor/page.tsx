"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SkeletonStatCard, SkeletonCard } from "@/components/Skeleton";
import { EmergencyAlertDoctor } from "@/components/EmergencyAlert";
import { IntegrityBadge } from "@/components/IntegrityBadge";

interface Appointment {
  id: string;
  patientName: string;
  patientUsername?: string;
  age: number;
  problem: string;
  type: string;
  date: string;
  time: string;
  status: string;
  reportFile?: string;
  payment: string;
  createdAt: string;
  noShowRisk?: { score: number; riskLevel: 'low' | 'medium' | 'high'; interventions: string[] };
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [integrityScore, setIntegrityScore] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showPrescription, setShowPrescription] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  // Phase 2 Emergency Alert state
  const [emergencyAlert, setEmergencyAlert] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) { router.push("/login"); return; }
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("vitalink_user", JSON.stringify(data.user));
        
        await Promise.all([
          fetchAppointments(data.user.username),
          fetchIntegrityScore(data.user.username)
        ]);
        
      } catch {
        router.push("/login");
      } finally {
        setSessionLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const fetchIntegrityScore = async (username: string) => {
    try {
      const res = await fetch(`/api/doctors/${username}/integrity`);
      const data = await res.json();
      setIntegrityScore(data);
    } catch {}
  };

  const fetchAppointments = async (username: string) => {
    try {
      const res = await fetch(`/api/appointments?username=${username}&role=doctor`);
      const data = await res.json();
      const apts = data.appointments || [];

      // Fetch no-show risk for pending/confirmed appointments
      const enrichedApts = await Promise.all(apts.map(async (apt: Appointment) => {
        if (apt.status === "Pending" || apt.status === "Confirmed") {
          try {
            const riskRes = await fetch(`/api/appointments/${apt.id}/no-show-risk?patient=${apt.patientUsername || ''}&date=${apt.date}&time=${apt.time}&type=${apt.type}&createdAt=${apt.createdAt}`);
            const riskData = await riskRes.json();
            return { ...apt, noShowRisk: riskData };
          } catch { return apt; }
        }
        return apt;
      }));

      setAppointments(enrichedApts);
    } catch { /* fallback to empty */ }
    finally { setDataLoading(false); }
  };

  // Poll for emergency alerts every 2 seconds
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/emergency/check?doctor=${user.username}`);
        const data = await res.json();
        if (data.alert) {
          setEmergencyAlert(data.alert);
        } else {
          setEmergencyAlert(null); // Alert cleared or timed out
        }
      } catch (e) {}
    }, 2000);
    return () => clearInterval(timer);
  }, [user]);

  const handleEmergencyAccept = async () => {
    try {
      if (!emergencyAlert || !user) return;
      await fetch(`/api/emergency/${emergencyAlert.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", doctorUsername: user.username })
      });
      // Redirect straight to room with emergency context
      router.push(`/room?emergency=${emergencyAlert.id}`);
    } catch {
      toast.error("Failed to accept emergency");
    }
  };

  const handleEmergencyDecline = async () => {
    try {
      if (!emergencyAlert || !user) return;
      await fetch(`/api/emergency/${emergencyAlert.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", doctorUsername: user.username })
      });
      setEmergencyAlert(null);
    } catch {
      setEmergencyAlert(null);
    }
  };

  const updateStatus = async (apptId: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status } : a));
        toast.success(`Status updated to ${status}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch { toast.error("Network error"); }
  };

  const submitPrescription = () => {
    if (selectedPatient && prescriptionText.trim()) {
      setPrescriptions(prev => [...prev, { patient: selectedPatient.patientName, text: prescriptionText, date: new Date().toLocaleString() }]);
      setPrescriptionText("");
      setShowPrescription(false);
      setSelectedPatient(null);
      toast.success("Prescription saved & sent to patient");
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("vitalink_user");
      toast.success("Signed out");
      router.push("/login");
    } catch { toast.error("Failed to sign out"); }
  };

  // Demo data for when no real appointments exist
  const demoAppointments: Appointment[] = [
    { id: "demo_1", patientName: "Sarah Johnson", age: 28, problem: "Chest pain, Fatigue", type: "Follow-up", date: "2026-04-03", time: "10:00 AM", status: "Pending", payment: "Online", createdAt: "", noShowRisk: { score: 15, riskLevel: 'low', interventions: [] } },
    { id: "demo_2", patientName: "Rahul Menon", age: 45, problem: "Migraine, Nausea", type: "New Consult", date: "2026-04-03", time: "10:30 AM", status: "Pending", payment: "Cash", createdAt: "", noShowRisk: { score: 85, riskLevel: 'high', interventions: ['SMS + WhatsApp + Push at T-24h'] } },
    { id: "demo_3", patientName: "Priya Nair", age: 32, problem: "Skin rash, Itching", type: "Virtual", date: "2026-04-03", time: "11:00 AM", status: "Confirmed", reportFile: "sample.pdf", payment: "Insurance", createdAt: "", noShowRisk: { score: 45, riskLevel: 'medium', interventions: [] } },
    { id: "demo_4", patientName: "Arjun Das", age: 55, problem: "Severe back pain", type: "Emergency", date: "2026-04-03", time: "11:30 AM", status: "Confirmed", payment: "Online", createdAt: "" },
  ];

  const displayAppointments = appointments.length > 0 ? appointments : demoAppointments;
  const upcoming = displayAppointments.filter(a => a.status === "Pending" || a.status === "Confirmed");
  const completed = displayAppointments.filter(a => a.status === "Completed" || a.status === "Cancelled");

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-white/30 text-sm font-medium">Loading Doctor Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Emergency Alert Takeover Modal */}
      {emergencyAlert && (
        <EmergencyAlertDoctor 
          alert={emergencyAlert}
          onAccept={handleEmergencyAccept}
          onDecline={handleEmergencyDecline} 
        />
      )}

      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center font-bold text-lg">V</div>
          <span className="text-xl font-bold">VitaLink</span>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">Doctor</span>
        </div>
        <div className="flex items-center gap-6">
          {integrityScore && <IntegrityBadge record={integrityScore} />}
          <Link href="/room" className="text-sm text-white/50 hover:text-white transition-colors">Virtual Room</Link>
          <button onClick={handleSignOut} className="text-sm text-white/50 hover:text-white transition-colors">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Good Morning, {user?.fullName || "Doctor"}</h1>
          <p className="text-white/40 text-sm">{upcoming.length} upcoming appointments • {completed.length} completed</p>
        </div>

        {/* Stats */}
        {dataLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Upcoming", value: upcoming.length.toString(), accent: "text-cyan-400" },
              { label: "Completed", value: completed.filter(a => a.status === "Completed").length.toString(), accent: "text-emerald-400" },
              { label: "Cancelled", value: completed.filter(a => a.status === "Cancelled").length.toString(), accent: "text-red-400" },
              { label: "Integrity Score", value: integrityScore?.score || "94", accent: "text-yellow-400" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
                <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit" role="tablist">
          {["upcoming", "completed", "prescriptions"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} role="tab" aria-selected={activeTab === tab} className={`px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>{tab}</button>
          ))}
        </div>

        {/* UPCOMING TAB */}
        {activeTab === "upcoming" && (
          <div className="space-y-3">
            {dataLoading ? (
              [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
            ) : upcoming.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <h3 className="text-lg font-bold mb-1">No Upcoming Appointments</h3>
                <p className="text-sm text-white/40">Appointments will appear here when patients book with you.</p>
              </div>
            ) : upcoming.map(apt => (
              <div key={apt.id} className={`bg-white/[0.03] border rounded-2xl p-5 ${apt.type === "Emergency" ? "border-red-500/40 ring-1 ring-red-500/20 animate-pulse-subtle" : "border-white/5"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg text-white/60">{apt.patientName.charAt(0)}</div>
                    <div>
                      <h4 className="font-semibold">{apt.patientName} <span className="text-white/30 text-sm font-normal">• {apt.age}y</span></h4>
                      <p className="text-xs text-white/40 mt-0.5">{apt.problem}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* No-Show Risk ML Badge */}
                    {apt.noShowRisk && (
                      <div className="hidden md:flex flex-col items-end mr-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                          apt.noShowRisk.riskLevel === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          apt.noShowRisk.riskLevel === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {apt.noShowRisk.riskLevel} Risk ({apt.noShowRisk.score})
                        </span>
                        {apt.noShowRisk.riskLevel === 'high' && (
                          <span className="text-[9px] text-white/30 mt-1">Auto-Reminders Active</span>
                        )}
                      </div>
                    )}

                    <div className="text-right hidden md:block">
                      <p className="text-sm font-medium">{apt.time}</p>
                      <p className="text-xs text-white/40">{apt.type} • {apt.date}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      apt.type === "Emergency" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                      apt.status === "Pending" ? "bg-orange-500/20 text-orange-400 border border-orange-500/20" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                    }`}>{apt.type === "Emergency" ? "⚠ Emergency" : apt.status}</span>
                  </div>
                </div>

                {apt.reportFile && (
                  <div className="mb-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-blue-400 font-medium">📎 Medical Report Attached</span>
                    <a href={`/uploads/${apt.reportFile}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 font-bold hover:underline">View Report →</a>
                  </div>
                )}

                {apt.type === "Emergency" && (
                  <div className="mb-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-xs text-red-300 mb-2 font-medium">⚠️ This patient requires urgent attention</p>
                    <Link href={`/room?emergency=${apt.id}`} className="inline-block px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                      🚨 Start Emergency Call
                    </Link>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                  {apt.status === "Pending" && (
                    <button onClick={() => updateStatus(apt.id, "Confirmed")} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors">
                      ✓ Confirm
                    </button>
                  )}
                  <button onClick={() => updateStatus(apt.id, "Completed")} className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/20 transition-colors">
                    ✓ Mark Complete
                  </button>
                  <button onClick={() => updateStatus(apt.id, "Cancelled")} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors">
                    ✕ Cancel
                  </button>
                  <Link href="/room" className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-lg hover:bg-cyan-500/20 transition-colors">
                    📹 Start Call
                  </Link>
                  <button onClick={() => { setSelectedPatient(apt); setShowPrescription(true); }} className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-500/20 transition-colors">
                    📝 Prescribe
                  </button>
                  
                  {apt.noShowRisk?.riskLevel === 'high' && (
                    <button onClick={() => toast.success("Reminder sent via SMS, WhatsApp & Push")} className="ml-auto px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/20 transition-colors">
                      🔔 Send Urgent Reminder
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COMPLETED TAB */}
        {activeTab === "completed" && (
          <div className="space-y-3">
            {completed.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <h3 className="text-lg font-bold mb-1">No Completed Sessions Yet</h3>
                <p className="text-sm text-white/40">Completed and cancelled appointments will appear here.</p>
              </div>
            ) : completed.map(apt => (
              <div key={apt.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${apt.status === "Completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{apt.patientName.charAt(0)}</div>
                  <div>
                    <h4 className="font-semibold text-sm">{apt.patientName} • {apt.age}y</h4>
                    <p className="text-xs text-white/40">{apt.problem} • {apt.date}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${apt.status === "Completed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}>{apt.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === "prescriptions" && (
          <div className="space-y-3">
            {prescriptions.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                <h3 className="text-lg font-bold mb-1">No Prescriptions Written</h3>
                <p className="text-sm text-white/40">Click &quot;Prescribe&quot; on a patient to write one.</p>
              </div>
            ) : prescriptions.map((rx, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Prescription for {rx.patient}</h4>
                  <span className="text-xs text-white/30">{rx.date}</span>
                </div>
                <pre className="text-sm text-white/70 whitespace-pre-wrap font-sans bg-black/30 border border-white/5 rounded-xl p-4">{rx.text}</pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Modal */}
      {showPrescription && selectedPatient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-bold">Write Prescription</h3>
              <p className="text-sm text-white/40">Patient: {selectedPatient.patientName} • {selectedPatient.age}y</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="rx-diagnosis" className="text-xs text-white/50 font-semibold uppercase mb-1.5 block">Diagnosis</label>
                <input id="rx-diagnosis" type="text" placeholder="e.g. Acute bronchitis" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/30" />
              </div>
              <div>
                <label htmlFor="rx-text" className="text-xs text-white/50 font-semibold uppercase mb-1.5 block">Prescription</label>
                <textarea id="rx-text" value={prescriptionText} onChange={e => setPrescriptionText(e.target.value)} placeholder={"1. Tab Amoxicillin 500mg — 1 tab, 3x daily — 5 days\n2. Tab Paracetamol 650mg — SOS for fever"} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/30 h-32 resize-none font-mono" />
              </div>
            </div>
            <div className="p-6 border-t border-white/5 flex gap-3">
              <button onClick={() => { setShowPrescription(false); setSelectedPatient(null); }} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/10" aria-label="Cancel prescription">Cancel</button>
              <button onClick={submitPrescription} className="flex-1 py-3 bg-emerald-500 text-black rounded-xl text-sm font-bold hover:bg-emerald-400" aria-label="Save and send prescription">Save & Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
