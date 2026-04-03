"use client";

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Lang } from '@/lib/translations';

export default function Home() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* 1. Header & Navigation (Practo/Apollo Vibe) */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(6,182,212,0.4)]">V</div>
            <span className="text-2xl font-black tracking-tight">VitaLink</span>
          </Link>
          {/* Links */}
          <div className="hidden lg:flex gap-8 text-sm font-semibold text-white/70">
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors py-2">{t.findDoctors}</Link>
            <Link href="/room" className="hover:text-cyan-400 transition-colors py-2 flex items-center gap-2">
               {t.videoConsult} <span className="bg-red-500/20 text-red-500 text-[10px] px-1.5 py-0.5 rounded border border-red-500/30">{t.live}</span>
            </Link>
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors py-2">{t.medicines}</Link>
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors py-2">{t.labTests}</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as Lang)}
            className="bg-white/5 border border-white/10 text-xs font-bold text-white px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer hover:bg-white/10 transition-all"
          >
            <option value="en" className="bg-[#0a0a0a]">Eng</option>
            <option value="hi" className="bg-[#0a0a0a]">हिंदी</option>
            <option value="te" className="bg-[#0a0a0a]">తెలుగు</option>
            <option value="ta" className="bg-[#0a0a0a]">தமிழ்</option>
            <option value="kn" className="bg-[#0a0a0a]">ಕನ್ನಡ</option>
          </select>
          <div className="hidden md:flex gap-4 text-xs font-semibold text-white/50">
             <span className="hover:text-white cursor-pointer">For Providers ▾</span>
             <span className="hover:text-white cursor-pointer">Security ▾</span>
          </div>
          <Link href="/login" className="px-6 py-2.5 text-sm font-bold border border-white/20 rounded-lg hover:bg-white hover:text-black transition-all">
            {t.loginSignup}
          </Link>
        </div>
      </nav>

      {/* 2. Global Semantic Search Bar & Hero */}
      <section className="relative pt-16 pb-8 px-6 flex flex-col items-center border-b border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black">
         <h1 className="text-4xl md:text-5xl font-black mb-10 text-center tracking-tight leading-tight max-w-3xl">
           {t.heroTitle} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{t.heroTitleAccent}</span>
         </h1>
         
         <div className="w-full max-w-4xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl">
               <div className="flex items-center gap-2 px-4 border-r border-white/10 shrink-0">
                  <span className="text-xl">📍</span>
                  <span className="text-sm font-semibold text-white/70">Chennai, TN</span>
               </div>
               <input 
                 type="text" 
                 placeholder={t.heroSearchPlaceholder} 
                 className="flex-1 bg-transparent px-6 py-4 outline-none text-lg text-white placeholder-white/30"
               />
               <Link href="/triage" className="px-8 py-4 bg-cyan-500 text-black font-black rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  {t.analyzeIntent}
               </Link>
            </div>
         </div>
      </section>

      {/* 3. The Core 4 Action Cards */}
      <section className="px-6 py-12 max-w-7xl mx-auto border-b border-white/5">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/room" className="group p-6 rounded-3xl bg-gradient-to-b from-white/5 to-white/[0.01] border border-white/10 hover:border-cyan-500/50 transition-all flex flex-col items-center text-center overflow-hidden relative">
               <div className="w-full aspect-video bg-black rounded-xl mb-6 relative overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500')] bg-cover bg-center opacity-60 mix-blend-luminosity"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded">WebRTC</div>
               </div>
               <h3 className="text-xl font-bold mb-2">{t.instantVideo}</h3>
               <p className="text-sm text-white/50">{t.instantVideoDesc}</p>
            </Link>

            <Link href="/triage" className="group p-6 rounded-3xl bg-gradient-to-b from-white/5 to-white/[0.01] border border-white/10 hover:border-purple-500/50 transition-all flex flex-col items-center text-center overflow-hidden relative">
               <div className="w-full aspect-video bg-black rounded-xl mb-6 relative overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  <div className="text-[80px] filter grayscale opacity-80 group-hover:grayscale-0 transition-all">🤖</div>
               </div>
               <h3 className="text-xl font-bold mb-2">{t.semanticTriage}</h3>
               <p className="text-sm text-white/50">{t.semanticTriageDesc}</p>
            </Link>

            <Link href="/dashboard" className="group p-6 rounded-3xl bg-gradient-to-b from-white/5 to-white/[0.01] border border-white/10 hover:border-green-500/50 transition-all flex flex-col items-center text-center overflow-hidden relative">
               <div className="w-full aspect-video bg-black rounded-xl mb-6 relative overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-500">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
               </div>
               <h3 className="text-xl font-bold mb-2">{t.healthVault}</h3>
               <p className="text-sm text-white/50">{t.healthVaultDesc}</p>
            </Link>

            <Link href="/dashboard" className="group p-6 rounded-3xl bg-gradient-to-b from-white/5 to-white/[0.01] border border-white/10 hover:border-orange-500/50 transition-all flex flex-col items-center text-center overflow-hidden relative">
               <div className="w-full aspect-video bg-black rounded-xl mb-6 relative overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center bg-[#0a0a0a]">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-2xl animate-pulse">📍</div>
               </div>
               <h3 className="text-xl font-bold mb-2">{t.federatedMaps}</h3>
               <p className="text-sm text-white/50">{t.federatedMapsDesc}</p>
            </Link>
         </div>
      </section>

      {/* 4. Browse by Specialty/Concern Grid */}
      <section className="px-6 py-16 max-w-7xl mx-auto border-b border-white/5">
         <div className="flex justify-between items-end mb-10">
            <div>
               <h2 className="text-3xl font-bold mb-2">{t.consultOnline}</h2>
               <p className="text-white/60">{t.consultOnlineDesc}</p>
            </div>
            <Link href="/dashboard" className="hidden sm:block px-6 py-2 border border-cyan-500 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-500/10 transition-colors">
               {t.viewSpecialties}
            </Link>
         </div>

         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
            {[
               { icon: "🫀", label: "Cardiology" },
               { icon: "🧠", label: "Neurology" },
               { icon: "🦴", label: "Orthopedics" },
               { icon: "👶", label: "Pediatrics" },
               { icon: "🦷", label: "Dentist" },
               { icon: "👁️", label: "Eye Care" },
               { icon: "🤧", label: "Cold & Cough" },
               { icon: "⚕️", label: "General" },
               { icon: "🍎", label: "Dietitian" },
               { icon: "🤰", label: "Pregnancy" },
               { icon: "🧘‍♀️", label: "Depression" },
               { icon: "🩺", label: "Surgeries" }
            ].map((item, i) => (
               <Link href="/triage" key={i} className="flex flex-col items-center text-center group">
                  <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-4 group-hover:bg-white/10 group-hover:scale-110 group-hover:border-white/30 transition-all duration-300">
                     {item.icon}
                  </div>
                  <h4 className="font-semibold text-sm group-hover:text-cyan-400 transition-colors">{item.label}</h4>
               </Link>
            ))}
         </div>
      </section>

      {/* 5. In-Clinic Top Doctors (Horizontal Scroll) */}
      <section className="px-6 py-16 max-w-7xl mx-auto border-b border-white/5">
         <h2 className="text-3xl font-bold mb-2">Book an appointment for an in-clinic consultation</h2>
         <p className="text-white/60 mb-10">Find experienced doctors across all specialties.</p>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
               <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group cursor-pointer hover:border-white/30 transition-colors">
                  <div className="h-48 bg-black relative overflow-hidden">
                     <div className={`absolute inset-0 bg-cover bg-center opacity-60 filter group-hover:scale-105 transition-transform duration-700 bg-[url('https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500')]`}></div>
                  </div>
                  <div className="p-6">
                     <h3 className="font-bold text-xl mb-1">Dr. Sharma / Specialist</h3>
                     <p className="text-xs text-white/50 mb-4">Highly recommended • 15+ Yrs Exp</p>
                     <div className="py-1 px-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black tracking-widest uppercase inline-block rounded">
                        Integrity Score: 98/100
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* 6. Health Articles & Testimonials */}
      <section className="px-6 py-16 max-w-7xl mx-auto border-b border-white/5 flex flex-col md:flex-row gap-12">
         <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4">Read top articles from health experts</h2>
            <p className="text-white/60 mb-8 max-w-sm">Health articles that keep you informed about good health practices and achieve your goals.</p>
            <button className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors">
               See all articles
            </button>
         </div>
         <div className="flex-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
               <div className="h-40 bg-zinc-800 bg-[url('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500')] bg-cover bg-center"></div>
               <div className="p-4">
                  <p className="text-xs text-cyan-400 font-bold mb-1 uppercase tracking-wider">Coronavirus</p>
                  <h4 className="font-bold text-sm">12 Coronavirus Myths and Facts That You Should Be Aware Of</h4>
               </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
               <div className="h-40 bg-zinc-800 bg-[url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500')] bg-cover bg-center"></div>
               <div className="p-4">
                  <p className="text-xs text-cyan-400 font-bold mb-1 uppercase tracking-wider">Vitamins & Supplements</p>
                  <h4 className="font-bold text-sm">Eating Right to Build Immunity Against Cold and Viral Infections</h4>
               </div>
            </div>
         </div>
      </section>

      {/* 7. App Download Intercept */}
      <section className="px-6 py-16 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 justify-center">
         <div className="w-[300px] h-[600px] bg-black border-8 border-gray-800 rounded-[3rem] relative shadow-2xl overflow-hidden flex items-center justify-center shrink-0">
            {/* Phone Notch */}
            <div className="absolute top-0 w-32 h-6 bg-gray-800 rounded-b-xl z-10"></div>
            {/* Mock App UI */}
            <div className="absolute inset-0 bg-blue-900/40 p-4 pt-10">
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                     <div className="h-4 bg-white/20 rounded w-3/4"></div>
                     <div className="h-3 bg-white/20 rounded w-1/2"></div>
                  </div>
               </div>
               <div className="w-full aspect-[3/4] bg-white/10 rounded-2xl mt-8 border border-white/20 flex flex-col relative overflow-hidden">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500')] bg-cover bg-center mix-blend-luminosity opacity-50"></div>
                   <div className="mt-auto p-4 bg-gradient-to-t from-black to-transparent z-10">
                      <div className="h-4 bg-white/90 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-red-600 rounded-full w-full"></div>
                   </div>
               </div>
            </div>
         </div>
         <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">Download the VitaLink app</h2>
            <p className="text-white/60 mb-8 leading-relaxed">
               Access video consultations and top-rated clinics with the ZKP Verified App. Connect with doctors online, available 24/7, from the comfort of your home.
            </p>
            <p className="text-sm font-bold mb-3">Get the link to download the app</p>
            <div className="flex gap-2 mb-8">
               <div className="flex border border-white/20 rounded-lg overflow-hidden flex-1 bg-white/5">
                  <div className="px-4 py-3 bg-white/5 border-r border-white/20 text-white/60">+91</div>
                  <input type="text" placeholder="Enter phone number" className="bg-transparent px-4 py-3 outline-none flex-1 text-sm text-white" />
               </div>
               <button className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400">Send SMS</button>
            </div>
            <div className="flex gap-4">
               <button className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 flex items-center gap-2 font-semibold">
                  <span className="text-xl">🍏</span> App Store
               </button>
               <button className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 flex items-center gap-2 font-semibold">
                  <span className="text-xl">▶️</span> Google Play
               </button>
            </div>
         </div>
      </section>

      {/* 8. Mega Footer */}
      <footer className="bg-[#050505] border-t border-white/5 pt-16 pb-8 px-6 mt-16">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
            <div className="flex flex-col space-y-3">
               <h4 className="font-bold text-white mb-2">VitaLink</h4>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">About</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Blog</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Careers</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Press</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Contact Us</Link>
            </div>
            <div className="flex flex-col space-y-3">
               <h4 className="font-bold text-white mb-2">For patients</h4>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Search for doctors</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Search for clinics</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Search for hospitals</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Book Diagnostic Tests</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Book Full Body Checkups</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Read health articles</Link>
            </div>
            <div className="flex flex-col space-y-3">
               <h4 className="font-bold text-white mb-2">For doctors</h4>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">VitaLink Profile</Link>
            </div>
            <div className="flex flex-col space-y-3">
               <h4 className="font-bold text-white mb-2">For clinics</h4>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Ray by VitaLink</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">VitaLink Reach</Link>
            </div>
            <div className="flex flex-col space-y-3">
               <h4 className="font-bold text-white mb-2">More</h4>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Help</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Terms & Conditions</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Healthcare Directory</Link>
            </div>
            <div className="flex flex-col space-y-3">
               <h4 className="font-bold text-white mb-2">Social</h4>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Facebook</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Twitter</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">LinkedIn</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Youtube</Link>
               <Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">Github</Link>
            </div>
         </div>
         <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4">
               <div className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold text-sm">V</div>
               <span className="text-xl font-bold tracking-tight text-white">VitaLink</span>
            </div>
            <p className="text-xs text-white/30">Copyright © 2026, VitaLink Technologies. All rights reserved.</p>
         </div>
      </footer>

    </div>
  );
}
