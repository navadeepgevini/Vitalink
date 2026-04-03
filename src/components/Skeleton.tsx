"use client";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 bg-white/5 rounded-lg animate-pulse ${className}`} />
  );
}

export function SkeletonAvatar({ size = "w-11 h-11" }: { size?: string }) {
  return (
    <div className={`${size} rounded-full bg-white/5 animate-pulse shrink-0`} />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white/[0.03] border border-white/5 rounded-2xl p-5 animate-pulse ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded w-2/3" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-4/5" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="h-3 bg-white/5 rounded w-1/2 mb-2" />
      <div className="h-7 bg-white/5 rounded w-1/3 mb-1" />
      <div className="h-2 bg-white/5 rounded w-1/4 mt-1" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-white/5 flex gap-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-3 bg-white/5 rounded w-24" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="px-6 py-4 border-b border-white/5 last:border-0 flex items-center gap-8">
          <div className="flex items-center gap-3">
            <SkeletonAvatar size="w-9 h-9" />
            <div className="h-4 bg-white/5 rounded w-32" />
          </div>
          <div className="h-3 bg-white/5 rounded w-40 hidden md:block" />
          <div className="h-3 bg-white/5 rounded w-24 hidden md:block" />
          <div className="h-5 bg-white/5 rounded-full w-16" />
          <div className="h-7 bg-white/5 rounded-lg w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      {/* Appointment card */}
      <SkeletonCard />
      {/* Map placeholder */}
      <div className="w-full h-[300px] bg-white/[0.03] border border-white/5 rounded-2xl" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <p className="text-white/30 text-sm font-medium">Loading VitaLink...</p>
      </div>
    </div>
  );
}
