"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

type Role = "patient" | "doctor" | "admin" | null;

// ─── Zod Schemas ─────────────────────────────────────
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  specialty: z.string().optional(),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

// ─── Password Strength ──────────────────────────────
function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "20%" };
  if (score <= 2) return { label: "Fair", color: "bg-orange-500", width: "40%" };
  if (score <= 3) return { label: "Good", color: "bg-yellow-500", width: "60%" };
  if (score <= 4) return { label: "Strong", color: "bg-emerald-500", width: "80%" };
  return { label: "Very Strong", color: "bg-cyan-500", width: "100%" };
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [loading, setLoading] = useState(false);

  // ─── Login Form ──────────────────────────────────
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  // ─── Register Form ────────────────────────────────
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", username: "", email: "", password: "", specialty: "" },
  });

  const watchRegPassword = registerForm.watch("password");
  const pwStrength = getPasswordStrength(watchRegPassword || "");

  // ─── Role dashboards ──────────────────────────────
  const roleDashboard: Record<string, string> = {
    patient: "/dashboard",
    doctor: "/doctor",
    admin: "/admin",
  };

  const handleLogin = async (data: LoginData) => {
    if (!selectedRole) { toast.error("Please select a role first"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "Login failed"); setLoading(false); return; }

      if (result.user.role !== selectedRole) {
        toast.error(`This account is registered as '${result.user.role}', not '${selectedRole}'`);
        setLoading(false);
        return;
      }

      // Store in localStorage for client-side display (auth is cookie-based now)
      localStorage.setItem("vitalink_user", JSON.stringify(result.user));
      toast.success("Login successful! Redirecting...");

      setTimeout(() => {
        const target = redirectTo || roleDashboard[result.user.role] || "/dashboard";
        router.push(target);
      }, 600);
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    if (!selectedRole) { toast.error("Please select a role first"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: selectedRole }),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "Registration failed"); setLoading(false); return; }

      localStorage.setItem("vitalink_user", JSON.stringify(result.user));
      toast.success("Registration successful! Redirecting...");
      setTimeout(() => {
        router.push(roleDashboard[selectedRole!] || "/dashboard");
      }, 600);
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  };

  const roles = [
    { id: "patient" as Role, icon: "👤", title: "Patient", desc: "Book appointments & consult doctors", gradient: "from-cyan-500/20 to-blue-500/10", border: "border-cyan-500/30", activeBorder: "border-cyan-500", text: "text-cyan-400" },
    { id: "doctor" as Role, icon: "🩺", title: "Doctor", desc: "Manage patients & consultations", gradient: "from-emerald-500/20 to-green-500/10", border: "border-emerald-500/30", activeBorder: "border-emerald-500", text: "text-emerald-400" },
    { id: "admin" as Role, icon: "🛡️", title: "Admin", desc: "Platform management & analytics", gradient: "from-purple-500/20 to-pink-500/10", border: "border-purple-500/30", activeBorder: "border-purple-500", text: "text-purple-400" },
  ];

  const inputClass = "w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus-visible:ring-2 focus-visible:ring-cyan-500/50 transition-all";
  const errorClass = "text-red-400 text-xs mt-1.5 font-medium";

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] bg-cyan-900/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-200px] left-[-200px] w-[600px] h-[600px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4" aria-label="VitaLink Home">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-2xl shadow-[0_0_25px_rgba(6,182,212,0.3)]">V</div>
            <span className="text-3xl font-black tracking-tight">VitaLink</span>
          </Link>
          <p className="text-white/40 text-sm">{mode === "login" ? "Sign in to your account" : "Create a new account"}</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6" role="tablist">
          <button onClick={() => setMode("login")} role="tab" aria-selected={mode === "login"} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${mode === "login" ? "bg-white text-black" : "text-white/50"}`}>Sign In</button>
          <button onClick={() => setMode("register")} role="tab" aria-selected={mode === "register"} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${mode === "register" ? "bg-white text-black" : "text-white/50"}`}>Register</button>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {roles.map((role) => (
            <button key={role.id} onClick={() => setSelectedRole(role.id)} aria-label={`Select ${role.title} role`}
              className={`p-4 rounded-2xl border-2 bg-gradient-to-b ${role.gradient} transition-all duration-300 text-center ${
                selectedRole === role.id ? `${role.activeBorder} scale-[1.02]` : `border-white/5 hover:${role.border}`
              }`}
            >
              <div className="text-2xl mb-2">{role.icon}</div>
              <h3 className={`font-bold text-xs ${selectedRole === role.id ? role.text : "text-white/80"}`}>{role.title}</h3>
            </button>
          ))}
        </div>

        {/* ──── LOGIN FORM ──────────────────────── */}
        {selectedRole && mode === "login" && (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-username" className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Username</label>
              <input id="login-username" type="text" {...loginForm.register("username")} placeholder="johndoe" className={inputClass} />
              {loginForm.formState.errors.username && <p className={errorClass}>{loginForm.formState.errors.username.message}</p>}
            </div>
            <div>
              <label htmlFor="login-password" className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Password</label>
              <input id="login-password" type="password" {...loginForm.register("password")} placeholder="••••••••" className={inputClass} />
              {loginForm.formState.errors.password && <p className={errorClass}>{loginForm.formState.errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading || !loginForm.formState.isValid} aria-label="Sign in"
              className={`w-full py-4 font-bold rounded-xl transition-all text-sm tracking-wide ${
                selectedRole === "patient" ? "bg-cyan-500 hover:bg-cyan-400 text-black" :
                selectedRole === "doctor" ? "bg-emerald-500 hover:bg-emerald-400 text-black" :
                "bg-purple-500 hover:bg-purple-400 text-white"
              } ${(loading || !loginForm.formState.isValid) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Signing in..." : `Sign in as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
            </button>
          </form>
        )}

        {/* ──── REGISTER FORM ──────────────────── */}
        {selectedRole && mode === "register" && (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-fullname" className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Full Name</label>
              <input id="reg-fullname" type="text" {...registerForm.register("fullName")} placeholder="Dr. John Smith" className={inputClass} />
              {registerForm.formState.errors.fullName && <p className={errorClass}>{registerForm.formState.errors.fullName.message}</p>}
            </div>
            <div>
              <label htmlFor="reg-username" className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Username</label>
              <input id="reg-username" type="text" {...registerForm.register("username")} placeholder="johndoe" className={inputClass} />
              {registerForm.formState.errors.username && <p className={errorClass}>{registerForm.formState.errors.username.message}</p>}
            </div>
            <div>
              <label htmlFor="reg-email" className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Email</label>
              <input id="reg-email" type="email" {...registerForm.register("email")} placeholder="doctor@vitalink.health" className={inputClass} />
              {registerForm.formState.errors.email && <p className={errorClass}>{registerForm.formState.errors.email.message}</p>}
            </div>
            {selectedRole === "doctor" && (
              <div>
                <label htmlFor="reg-specialty" className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Specialty</label>
                <select id="reg-specialty" {...registerForm.register("specialty")} className={inputClass + " appearance-none"}>
                  <option value="">Select specialty</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Psychiatry">Psychiatry</option>
                </select>
              </div>
            )}
            <div>
              <label htmlFor="reg-password" className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Password</label>
              <input id="reg-password" type="password" {...registerForm.register("password")} placeholder="••••••••" className={inputClass} />
              {registerForm.formState.errors.password && <p className={errorClass}>{registerForm.formState.errors.password.message}</p>}
              {/* Password strength indicator */}
              {watchRegPassword && watchRegPassword.length > 0 && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`} style={{ width: pwStrength.width }} />
                  </div>
                  <p className={`text-xs mt-1 font-medium ${
                    pwStrength.label === "Weak" ? "text-red-400" :
                    pwStrength.label === "Fair" ? "text-orange-400" :
                    pwStrength.label === "Good" ? "text-yellow-400" :
                    "text-emerald-400"
                  }`}>{pwStrength.label}</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || !registerForm.formState.isValid} aria-label="Register account"
              className={`w-full py-4 font-bold rounded-xl transition-all text-sm tracking-wide ${
                selectedRole === "patient" ? "bg-cyan-500 hover:bg-cyan-400 text-black" :
                selectedRole === "doctor" ? "bg-emerald-500 hover:bg-emerald-400 text-black" :
                "bg-purple-500 hover:bg-purple-400 text-white"
              } ${(loading || !registerForm.formState.isValid) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Registering..." : `Register as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
