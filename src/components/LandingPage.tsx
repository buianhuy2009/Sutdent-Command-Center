import React from 'react';
import {
  GraduationCap,
  Layers,
  Sparkles,
  Mail,
  CheckSquare,
  FileText,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sun,
  Moon,
  ExternalLink,
  Zap,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  onExploreDemo: () => void;
  isLoggingIn: boolean;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onExploreDemo,
  isLoggingIn,
  darkMode,
  setDarkMode,
}) => {
  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#141413] text-[#141413] dark:text-[#FAF9F5] transition-colors flex flex-col font-sans selection:bg-[#D97757] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 dark:bg-[#141413]/90 backdrop-blur-md border-b border-[#DFDACB] dark:border-[#2C2B27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D97757] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#D97757]/20">
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
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Sign In with Google'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D97757]/10 dark:bg-[#D97757]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Pill Badge — aligned to D97757 terracotta palette */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D97757]/10 dark:bg-[#D97757]/15 border border-[#D97757]/20 text-[#AA4F32] dark:text-[#E8A08A] text-xs font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-top-4 duration-300">
              <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
              <span>The Next-Gen Academic Operating System for Students</span>
            </div>

            {/* Main Headline — unified terracotta accent */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
              Conquer your semester with a{' '}
              <span className="text-[#D97757]">
                unified student hub
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Connect your <strong>Canvas LMS</strong> courses, Google Calendar schedule, intelligent Gmail AI scanner, and formatted Google Docs in one powerful dashboard with Gemini Flash AI study coaching.
            </p>

            {/* Large Prominent CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                id="btn-landing-primary-signup"
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="w-full sm:w-auto px-8 py-4 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-base font-bold shadow-lg shadow-[#D97757]/25 flex items-center justify-center gap-3 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
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

            {/* Trust Badges */}
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Free & Open-Source</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Canvas LMS Direct Feed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Google Workspace Synced</span>
              </div>
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
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-orange-400 dark:hover:border-orange-500 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
                    <Layers className="w-6 h-6" />
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
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-[#D97757] dark:hover:border-[#D97757] transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-[#D97757] dark:text-[#E8A08A] flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Study Coach (Gemini Flash)</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Ask questions, plan 45-minute focus blocks, break down complex essays, and get personalized study recommendations aware of your real assignments and schedule.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-[#D97757] dark:text-[#E8A08A] flex items-center gap-1">
                  <span>Powered by Gemini 3.6 Flash</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Feature 3: Gmail Scanner */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-[#D97757] dark:hover:border-[#D97757] transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-[#D97757] dark:text-[#E8A08A] flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Gmail Scanner & Spam Filter</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Intelligently categorizes teacher emails, isolates exam alerts, and filters out shopping & newsletter spam with bilingual (EN/VI) support and one-click quick draft replies.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-[#D97757] dark:text-[#E8A08A] flex items-center gap-1">
                  <span>Smart Spam Shield</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Feature 4: Assignment Tracker */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <CheckSquare className="w-6 h-6" />
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
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6" />
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
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-[#D97757] dark:hover:border-[#D97757] transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-[#D97757] dark:text-[#E8A08A] flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Doc Starter Studio</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Generate professionally formatted MLA 9th or APA 7th edition Google Docs directly in your Google Drive with customizable action milestones.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-[#D97757] dark:text-[#E8A08A] flex items-center gap-1">
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

        {/* Bottom CTA Banner — unified terracotta */}
        <section className="py-16 sm:py-20 bg-[#D97757] text-white text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to take control of your classes?
            </h2>
            <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto">
              Join students staying ahead on Canvas, organizing Google Workspace, and boosting study productivity.
            </p>
            <div className="pt-2">
              <button
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="px-8 py-4 bg-white text-[#D97757] hover:bg-orange-50 disabled:opacity-50 rounded-2xl text-base font-extrabold shadow-xl inline-flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <GraduationCap className="w-5 h-5 text-[#D97757]" />
                <span>Get Started Free with Google</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#0B1120] border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#D97757]" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Student Command Center</span>
            <span>• Open Source Academic Hub</span>
          </div>

          <div className="flex items-center gap-4">
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
      </footer>
    </div>
  );
};
