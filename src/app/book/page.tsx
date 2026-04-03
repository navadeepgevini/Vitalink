"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { formatINR } from "@/lib/currency";

interface Doctor {
  username: string;
  fullName: string;
  specialty: string;
}

const bookingSchema = z.object({
  age: z.string().min(1, "Age is required").refine(val => {
    const num = parseInt(val);
    return num >= 1 && num <= 120;
  }, "Age must be between 1 and 120"),
  problem: z.string().min(10, "Please describe your symptoms in at least 10 characters"),
  selectedDoctor: z.string().min(1, "Please select a doctor"),
  appointmentType: z.string().min(1),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1),
  payment: z.string().min(1),
});

type BookingData = z.infer<typeof bookingSchema>;

export default function BookPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<BookingData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      age: "",
      problem: "",
      selectedDoctor: "",
      appointmentType: "Virtual",
      date: "",
      time: "10:00 AM",
      payment: "Online",
    },
    mode: "onChange",
  });

  const watchPayment = watch("payment");
  const watchType = watch("appointmentType");

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) { router.push("/login"); return; }
        const data = await res.json();
        if (data.user.role !== "patient") { router.push("/login"); return; }
        setUser(data.user);
        localStorage.setItem("vitalink_user", JSON.stringify(data.user));
      } catch { router.push("/login"); return; }
      finally { setSessionLoading(false); }

      // Fetch registered doctors
      try {
        const dRes = await fetch("/api/doctors");
        const dData = await dRes.json();
        setDoctors(dData.doctors || []);
      } catch { /* fallback */ }

      // Fetch triage result if exists
      const triage = localStorage.getItem("vitalink_triage_result");
      if (triage) {
        setValue("problem", `AI Triage Result: ${triage}`);
        localStorage.removeItem("vitalink_triage_result");
      }
    };
    init();
  }, [router, setValue]);

  const onSubmit = async (data: BookingData) => {
    if (!user) return;
    setLoading(true);

    const doc = doctors.find(d => d.username === data.selectedDoctor);
    const formData = new FormData();
    formData.append("patientUsername", user.username);
    formData.append("patientName", user.fullName);
    formData.append("doctorUsername", data.selectedDoctor);
    formData.append("doctorName", doc?.fullName || data.selectedDoctor);
    formData.append("age", data.age);
    formData.append("problem", data.problem);
    formData.append("type", data.appointmentType);
    formData.append("date", data.date);
    formData.append("time", data.time);
    formData.append("payment", data.payment);
    if (selectedFile) formData.append("report", selectedFile);

    try {
      const res = await fetch("/api/appointments", { method: "POST", body: formData });
      const result = await res.json();

      if (res.ok) {
        toast.success("Appointment booked successfully!");
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        toast.error(result.error || "Booking failed");
        setLoading(false);
      }
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  };

  const priceMap: Record<string, number> = { "Virtual": 299, "In-Person": 499, "Home Visit": 899 };
  const currentPrice = priceMap[watchType] || 299;

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-white/30 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/30 focus-visible:ring-2 focus-visible:ring-cyan-500/50 transition-all";
  const errorClass = "text-red-400 text-xs mt-1.5 font-medium";

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-lg">V</div>
          <span className="text-xl font-bold">VitaLink</span>
        </div>
        <Link href="/dashboard" className="text-sm text-white/50 hover:text-white" aria-label="Back to dashboard">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Book an Appointment</h1>
        <p className="text-white/40 text-sm mb-8">Fill in the details below to schedule your consultation</p>

        <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="space-y-5" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="book-age" className="text-xs font-semibold text-white/50 uppercase mb-1.5 block">Age *</label>
              <input id="book-age" type="number" {...register("age")} placeholder="28" className={inputClass} />
              {errors.age && <p className={errorClass}>{errors.age.message}</p>}
            </div>
            <div>
              <label htmlFor="book-type" className="text-xs font-semibold text-white/50 uppercase mb-1.5 block">Consultation Type *</label>
              <select id="book-type" {...register("appointmentType")} className={inputClass + " appearance-none"}>
                <option value="Virtual">💻 Online Consultation — {formatINR(299)}</option>
                <option value="In-Person">🏥 In-Person (Clinic) — {formatINR(499)}</option>
                <option value="Home Visit">🏠 Home Doctor — {formatINR(899)}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="book-problem" className="text-xs font-semibold text-white/50 uppercase mb-1.5 block">Problem / Symptoms *</label>
            <textarea id="book-problem" {...register("problem")} placeholder="Describe your symptoms or health concern in detail..." className={inputClass + " h-24 resize-none"} />
            {errors.problem && <p className={errorClass}>{errors.problem.message}</p>}
          </div>

          <div>
            <label htmlFor="book-doctor" className="text-xs font-semibold text-white/50 uppercase mb-1.5 block">Select Doctor *</label>
            <select id="book-doctor" {...register("selectedDoctor")} className={inputClass + " appearance-none"}>
              <option value="">Choose a doctor...</option>
              {doctors.map(doc => (
                <option key={doc.username} value={doc.username}>{doc.fullName} — {doc.specialty}</option>
              ))}
              {doctors.length === 0 && <option value="" disabled>No doctors registered yet</option>}
            </select>
            {errors.selectedDoctor && <p className={errorClass}>{errors.selectedDoctor.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="book-date" className="text-xs font-semibold text-white/50 uppercase mb-1.5 block">Preferred Date *</label>
              <input id="book-date" type="date" {...register("date")} className={inputClass} />
              {errors.date && <p className={errorClass}>{errors.date.message}</p>}
            </div>
            <div>
              <label htmlFor="book-time" className="text-xs font-semibold text-white/50 uppercase mb-1.5 block">Time Slot</label>
              <select id="book-time" {...register("time")} className={inputClass + " appearance-none"}>
                {["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase mb-1.5 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {["Online", "Cash", "Insurance"].map(p => (
                <button key={p} type="button" onClick={() => setValue("payment", p, { shouldValidate: true })}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${watchPayment === p ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}
                  aria-label={`Select ${p} payment`}
                >{p}</button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase mb-1.5 block">Upload Medical Report (PDF/Image, max 16MB)</label>
            <div onClick={() => fileRef.current?.click()} className="w-full px-4 py-6 bg-white/5 border-2 border-dashed border-white/10 rounded-xl text-center cursor-pointer hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all" role="button" aria-label="Upload medical report">
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
              {selectedFile ? (
                <div>
                  <p className="text-sm text-cyan-400 font-semibold">📎 {selectedFile.name}</p>
                  <p className="text-xs text-white/30 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-white/40">📄 Click to upload or drag a file here</p>
                  <p className="text-xs text-white/20 mt-1">PDF, JPG, PNG up to 16MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-white/50">Consultation Fee</span>
            <span className="text-lg font-bold text-cyan-400">{formatINR(currentPrice)}</span>
          </div>

          <div className="flex gap-3 pt-4">
            <Link href="/dashboard" className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-center hover:bg-white/10 transition-colors" aria-label="Cancel and return to dashboard">Cancel</Link>
            <button type="submit" disabled={loading || !isValid}
              className={`flex-1 py-3.5 bg-cyan-500 text-black rounded-xl text-sm font-bold hover:bg-cyan-400 transition-colors ${(loading || !isValid) ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label="Confirm booking"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
