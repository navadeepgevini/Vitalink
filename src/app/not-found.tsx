import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        {/* 404 Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        </div>

        <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">404</h1>
        <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
        <p className="text-white/40 text-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-cyan-500 text-black text-sm font-bold rounded-xl hover:bg-cyan-400 transition-colors"
            aria-label="Return to home page"
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white/5 border border-white/10 text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Go to login page"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
