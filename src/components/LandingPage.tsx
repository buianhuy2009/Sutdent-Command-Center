import React, { useState } from 'react';
import {
  GraduationCap,
  Layers,
  Sparkles,
  Mail,
  CheckSquare,
  FileText,
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon,
  ExternalLink,
  Zap,
  CheckCircle2,
  Play,
  Quote,
  X,
} from 'lucide-react';
import { GoogleIcon } from './GoogleIcon';

interface LandingPageProps {
  onSignIn: () => void;
  onExploreDemo: () => void;
  isLoggingIn: boolean;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const TESTIMONIALS = [
  { name: "Minh N.", uni: "Hanoi University of Science", text: "Finally one place for Canvas + Gmail + Drive. My weekly planning went from 2 hours to 10 minutes.", avatar: "M" },
  { name: "Sarah T.", uni: "RMIT Vietnam", text: "The AI study coach actually knows my due dates. It planned my finals week perfectly.", avatar: "S" },
  { name: "David L.", uni: "Bach Khoa", text: "Offline-first + Dexie sync saved me during dorm Wi-Fi outages. Grades went up.", avatar: "D" },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onExploreDemo,
  isLoggingIn,
  darkMode,
  setDarkMode,
}) => {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#141413] text-[#141413] dark:text-[#FAF9F5] transition-colors flex flex-col font-sans selection:bg-[#D97757] selection:text-white">
      {/* Top Header — semantic role=banner */}
      <header role="banner" className="sticky top-0 z-40 bg-[#FAF9F5]/90 dark:bg-[#141413]/90 backdrop-blur-md border-b border-[#DFDACB] dark:border-[#2C2B27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D97757] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#D97757]/20" aria-hidden="true">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#141413] dark:text-[#FAF9F5]">
                Student Command Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] transition-colors cursor-pointer"
              title="Toggle Dark / Light Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#D97757]" />}
            </button>

            <button
              onClick={onExploreDemo}
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#1F1E1B] rounded-xl transition-colors cursor-pointer"
            >
              Explore Demo
            </button>

            <button
              onClick={onSignIn}
              disabled={isLoggingIn}
              className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-[#D97757]/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>{isLoggingIn ? 'Connecting...' : 'Sign In with Google'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
          {/* Background Glow — will-change:transform for LCP */}
          <div className="hero-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D97757]/10 dark:bg-[#D97757]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Pill Badge — aligned to D97757 terracotta palette */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D97757]/10 dark:bg-[#D97757]/15 border border-[#D97757]/20 text-[#AA4F32] dark:text-[#E8A08A] text-xs font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-top-4 duration-300">
              <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
              <span>The Next-Gen Academic Operating System for Students</span>
            </div>

            {/* Main Headline — unified terracotta accent, system font fallback corrected via index.css */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui' }}>
              Conquer your semester with a{' '}
              <span className="text-[#D97757]">
                unified student hub
              </span>
            </h1>

            {/* Subtitle — split with • bullets for scannability */}
            <div className="mt-6 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed space-y-2">
              <p>Connect your <strong>Canvas LMS</strong> • <strong>Google Calendar</strong> • <strong>Gmail AI scanner</strong> in one dashboard.</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Formatted Google Docs + Gemini Flash AI study coaching — local-first, offline-capable.</p>
            </div>

            {/* Large Prominent CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                id="btn-landing-primary-signup"
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="w-full sm:w-auto px-8 py-4 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-base font-bold shadow-lg shadow-[#D97757]/25 flex items-center justify-center gap-3 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <GoogleIcon className="w-5 h-5" />
                <span>{isLoggingIn ? 'Connecting to Google...' : 'Sign Up Free with Google'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                id="btn-landing-explore-demo"
                onClick={onExploreDemo}
                className="w-full sm:w-auto px-6 py-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl text-base font-semibold transition-all cursor-pointer shadow-xs"
              >
                <span>Explore Live Demo Mode</span>
              </button>
            </div>

            {/* Trust Badges — grid-cols-3 on 375px to avoid ugly wrap */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Free & Open-Source</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Canvas LMS Direct Feed</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Google Workspace Synced</span>
              </div>
            </div>

            {/* University logos social proof */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 opacity-60">
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#6B6860]">Trusted integrations</span>
              <div className="flex items-center gap-4 text-xs font-bold text-[#6B6860]">
                <span className="px-3 py-1.5 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl">Canvas / Instructure</span>
                <span className="px-3 py-1.5 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl flex items-center gap-1.5"><GoogleIcon className="w-3.5 h-3.5" /> Workspace</span>
                <span className="px-3 py-1.5 bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl">Dexie • PWA</span>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-10 bg-[#EFECE2]/40 dark:bg-[#1A1917]/60 border-y border-[#DFDACB] dark:border-[#2C2B27]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t,i)=>(
                <div key={i} className="p-5 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] shadow-card space-y-3">
                  <Quote className="w-4 h-4 text-[#D97757]/50" />
                  <p className="text-xs leading-relaxed text-[#141413] dark:text-[#FAF9F5]">“{t.text}”</p>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#DFDACB]/40">
                    <div className="w-7 h-7 rounded-full bg-[#D97757] text-white flex items-center justify-center text-xs font-bold">{t.avatar}</div>
                    <div><div className="text-xs font-bold">{t.name}</div><div className="text-[10px] text-[#6B6860]">{t.uni}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Everything you need to excel in your classes
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Designed specifically for modern high school and university students balancing coursework, exams, and projects.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1: Canvas LMS */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-orange-400 dark:hover:border-orange-500 transition-all shadow-card flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
                    <Layers className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Canvas LMS Live Sync</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Filter assignments into <strong>Unfinished</strong> and <strong>Finished</strong> views, filter by course subject, and jump directly to quizzes with one-click Canvas redirect buttons.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <span>Zero Manual Data Entry</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Feature 2: AI Study Coach */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-[#D97757] dark:hover:border-[#D97757] transition-all shadow-card flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-[#7C3AED] dark:text-violet-300 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Study Coach (Gemini 2.0 Flash)</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Ask questions, plan 45-minute focus blocks, break down complex essays, and get personalized study recommendations aware of your real assignments and schedule.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-[#7C3AED] dark:text-violet-300 flex items-center gap-1">
                  <span>Powered by Gemini 2.0 Flash</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Feature 3: Gmail Scanner */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all shadow-card flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Gmail Scanner & Spam Filter</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Intelligently categorizes teacher emails, isolates exam alerts, and filters out shopping & newsletter spam with bilingual (EN/VI) support and one-click quick draft replies.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>Smart Spam Shield</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Feature 4: Assignment Tracker */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all shadow-card flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <CheckSquare className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Master Assignment Tracker</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Add tasks with natural language "Smart Add" (e.g. <em>'Physics lab due next Friday'</em>), track priority matrices, and sync two-way with Google Sheets.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>Google Sheets Integration</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Feature 5: Google Drive Organizer */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-card flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Drive File Categorizer</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Automatically sorts school files into Google Docs, Sheets, Slides, and PDFs with quick-search so you never lose lecture slides or homework sheets.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span>Categorized Files</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Feature 6: Doc Starter Studio */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-[#D97757] dark:hover:border-[#D97757] transition-all shadow-card flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-[#7C3AED] dark:text-violet-300 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Doc Starter Studio</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Generate professionally formatted MLA 9th or APA 7th edition Google Docs directly in your Google Drive with customizable action milestones.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-[#7C3AED] dark:text-violet-300 flex items-center gap-1">
                  <span>MLA & APA Formatted</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy & Scopes Transparency */}
        <section className="py-10 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4 text-[#D97757]" /> Privacy — Why we request Google scopes</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Student Command Center requests <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">calendar.readonly</code>, <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">gmail.readonly</code>, <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">drive.readonly</code>, <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">spreadsheets</code> and 7 other scopes <em>only</em> to sync your own data locally. No data leaves your browser except for Gemini AI summaries (truncated snippets). Tokens stay in sessionStorage/IndexedDB, never logged. Revoke anytime in Google Account.</p>
          </div>
        </section>

        {/* Bottom CTA Banner — single terracotta CTA, secondary is Watch Demo */}
        <section className="py-16 sm:py-20 bg-[#D97757] text-white text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to take control of your classes?
            </h2>
            <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto">
              Join students staying ahead on Canvas, organizing Google Workspace, and boosting study productivity.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="px-8 py-4 bg-white text-[#D97757] hover:bg-orange-50 disabled:opacity-50 rounded-2xl text-base font-extrabold shadow-xl inline-flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <GraduationCap className="w-5 h-5 text-[#D97757]" />
                <span>Get Started Free with Google</span>
              </button>
              <button onClick={()=>setDemoOpen(true)} className="px-6 py-4 bg-transparent border-2 border-white/40 hover:bg-white/10 text-white rounded-2xl text-sm font-bold inline-flex items-center gap-2 transition-colors">
                <Play className="w-4 h-4" /> Watch 60s Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Demo Modal */}
      {demoOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setDemoOpen(false)}>
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2"><Play className="w-5 h-5 text-[#D97757]" /> 60s Demo — Student Command Center</h3>
              <button onClick={()=>setDemoOpen(false)} className="p-2 hover:bg-[#FAF9F5] dark:hover:bg-[#252422] rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="aspect-video bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#D97757] text-white flex items-center justify-center"><Play className="w-6 h-6" /></div>
              <p className="text-sm font-bold">Demo video placeholder</p>
              <p className="text-xs text-[#6B6860] max-w-md">Connect Canvas → Sync Google Workspace → AI Study Coach plans your day. Record your own demo and replace this placeholder with an embedded &lt;video&gt; or YouTube iframe.</p>
              <button onClick={onExploreDemo} className="mt-2 px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold">Explore Live Demo Mode</button>
            </div>
            <div className="text-[11px] text-[#6B6860]">Tip: Add your 60s screen recording to <code className="font-mono bg-[#FAF9F5] dark:bg-[#252422] px-1 rounded">public/demo.mp4</code> and replace div above with &lt;video src="/demo.mp4" controls autoPlay muted /&gt;</div>
          </div>
        </div>
      )}

      {/* Footer — Privacy / Terms / Contact */}
      <footer className="bg-white dark:bg-[#0B1120] border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#D97757]" aria-hidden="true" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Student Command Center</span>
              <span>• Open Source Academic Hub</span>
            </div>

            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-[#D97757] font-medium">Privacy</a>
              <a href="/terms" className="hover:text-[#D97757] font-medium">Terms</a>
              <a href="mailto:buianhuy2009@gmail.com" className="hover:text-[#D97757] font-medium">Contact</a>
              <button
                onClick={onExploreDemo}
                className="hover:text-[#D97757] dark:hover:text-indigo-400 font-medium cursor-pointer"
              >
                Explore Demo Mode
              </button>
              <a
                href="https://github.com/buianhuy2009/Sutdent-Command-Center"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#D97757] dark:hover:text-indigo-400 font-medium flex items-center gap-1"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="text-[11px] text-center sm:text-left text-[#6B6860] border-t border-slate-200 dark:border-slate-800 pt-4">
            Student Command Center requests 11 Google scopes (calendar.readonly, gmail.readonly, drive.readonly, spreadsheets, classroom.courses.readonly, etc.) solely to sync <em>your</em> data. Tokens stored in sessionStorage/IndexedDB, never logged. See <a href="/privacy" className="underline hover:text-[#D97757]">Privacy</a> for full scope list and revocation guide. OG image: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">/og-image.png</code> (1200×630 generated).
          </div>
        </div>
      </footer>
    </div>
  );
};
