import React from 'react';
import {
  Layers,
  Compass,
  CheckSquare,
  Mail,
  HardDrive,
  GraduationCap,
  BookOpen,
  Brain,
  Palette,
  Calculator,
  PenTool,
  Network,
  FileText,
  Timer,
  Columns2,
  Sparkles,
  Atom,
  Mic,
  Search,
  Zap,
  Bookmark,
  MessageSquare,
  GitBranch,
  FileCode,
  ShieldCheck,
  TrendingUp,
  ArrowRightLeft,
} from 'lucide-react';

interface AppLogoProps {
  id: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ id, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-14 h-14 text-lg rounded-2xl',
    xl: 'w-20 h-20 text-2xl rounded-3xl',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  }[size];

  switch (id) {
    case 'canvas':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20 shrink-0 ${className}`}>
          <svg className={iconSizes} viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="3 3" />
            <circle cx="12" cy="12" r="4" fill="white" />
          </svg>
        </div>
      );

    case 'radar':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0 ${className}`}>
          <Compass className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'tracker':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 shrink-0 ${className}`}>
          <CheckSquare className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'gmail':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-red-500 via-rose-500 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20 shrink-0 ${className}`}>
          <Mail className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'drive':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-amber-400 via-emerald-500 to-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0 ${className}`}>
          <HardDrive className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'classroom':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0 ${className}`}>
          <GraduationCap className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'moodle':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20 shrink-0 ${className}`}>
          <span className="font-extrabold tracking-tighter">M</span>
        </div>
      );

    case 'notebooklm':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20 shrink-0 ${className}`}>
          <Brain className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'flashcards':
    case 'quizlet':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0 ${className}`}>
          <span className="font-extrabold tracking-tight">Q</span>
        </div>
      );

    case 'anki':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/20 shrink-0 ${className}`}>
          <Layers className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'wolfram':
    case 'wolfram-symbolab':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-red-600 via-orange-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-red-600/20 shrink-0 ${className}`}>
          <span className="font-mono font-extrabold">∫dx</span>
        </div>
      );

    case 'scholar':
    case 'google-scholar':
    case 'zotero':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20 shrink-0 ${className}`}>
          <Bookmark className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'canva':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-cyan-400 via-teal-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-500/20 shrink-0 ${className}`}>
          <Palette className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'desmos-graphing':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0 ${className}`}>
          <svg className={iconSizes} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18" />
            <path d="M12 3v18" />
            <path d="M4 17c4-1 6-9 8-9s4 8 8 7" />
          </svg>
        </div>
      );

    case 'desmos-scientific':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-teal-500 to-cyan-700 text-white flex items-center justify-center font-bold shadow-md shadow-teal-500/20 shrink-0 ${className}`}>
          <Calculator className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'geogebra':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20 shrink-0 ${className}`}>
          <svg className={iconSizes} viewBox="0 0 24 24" fill="currentColor">
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="12" r="3" />
            <circle cx="12" cy="6" r="3" />
            <circle cx="12" cy="18" r="3" />
          </svg>
        </div>
      );

    case 'phet':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20 shrink-0 ${className}`}>
          <Atom className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'scribble-latex':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-yellow-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-yellow-500/20 shrink-0 ${className}`}>
          <Zap className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'excalidraw':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center font-bold shadow-md shadow-violet-600/20 shrink-0 ${className}`}>
          <PenTool className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'mermaid':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-pink-500/20 shrink-0 ${className}`}>
          <Network className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'pomodoro':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/20 shrink-0 ${className}`}>
          <Timer className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'viva':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white flex items-center justify-center font-bold shadow-md shadow-fuchsia-600/20 shrink-0 ${className}`}>
          <Mic className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'notes-markdown':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20 shrink-0 ${className}`}>
          <FileText className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'rubric':
    case 'turnitin':
    case 'gradescope':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0 ${className}`}>
          <ShieldCheck className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'feynman':
    case 'ai-suite':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center font-bold shadow-md shadow-rose-600/20 shrink-0 ${className}`}>
          <Sparkles className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'pdf-reader':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center font-bold shadow-md shadow-rose-600/20 shrink-0 ${className}`}>
          <FileText className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'quiz-generator':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20 shrink-0 ${className}`}>
          <CheckSquare className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'periodic-table':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-500/20 shrink-0 ${className}`}>
          <Atom className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'unit-converter':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0 ${className}`}>
          <ArrowRightLeft className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'arxiv':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/20 shrink-0 ${className}`}>
          <BookOpen className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'open-library':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20 shrink-0 ${className}`}>
          <Bookmark className={iconSizes} aria-hidden="true" />
        </div>
      );

    case 'splitscreen':
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-slate-600 to-zinc-700 text-white flex items-center justify-center font-bold shadow-md shadow-slate-600/20 shrink-0 ${className}`}>
          <Columns2 className={iconSizes} />
        </div>
      );

    default:
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-[#D97757] to-[#C86646] text-white flex items-center justify-center font-bold shrink-0 ${className}`}>
          <Sparkles className={iconSizes} aria-hidden="true" />
        </div>
      );
  }
};
