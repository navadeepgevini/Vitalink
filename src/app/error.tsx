"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-white/40 text-sm mb-8 leading-relaxed">
          {error.message || "An unexpected error occurred. Our team has been notified."}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-cyan-500 text-black text-sm font-bold rounded-xl hover:bg-cyan-400 transition-colors"
            aria-label="Try again"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-white/5 border border-white/10 text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Return to home page"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
