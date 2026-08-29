import React, { useState, useEffect } from 'react';
import {
  Globe,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  Key,
  Terminal,
  RefreshCw,
} from 'lucide-react';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    status?: string;
    platform?: string;
    hasGeminiKey?: boolean;
    timestamp?: string;
    error?: string;
  } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealthStatus(data);
    } catch (err: any) {
      setHealthStatus({ error: err.message || 'API unreachable' });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Vercel Deployment & Integration Guide
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ensure Google Workspace, Canvas LMS, and Gemini AI work smoothly on Vercel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1 text-xs sm:text-sm">
          {/* Health Status Bar */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  healthStatus?.status === 'ok'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Serverless Backend API Status:{' '}
                </span>
                <span className="text-slate-600 dark:text-slate-300 font-mono text-xs">
                  {healthStatus?.status === 'ok'
                    ? `Healthy (${healthStatus.platform || 'ready'})`
                    : healthStatus?.error || 'Checking...'}
                </span>
              </div>
            </div>

            <button
              onClick={checkHealth}
              disabled={isCheckingHealth}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              <span>Ping API</span>
            </button>
          </div>

          {/* Integration 1: Google Workspace / Firebase Auth */}
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>1. Google Workspace & Firebase Auth (Crucial)</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                Action Required
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              Google Auth blocks sign-in popups on new domains until authorized. When deploying to Vercel, you must add your Vercel domain to Firebase Console.
            </p>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Current domain to add:</span>
                <button
                  onClick={() => copyToClipboard(currentHostname, 'host')}
                  className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded font-mono font-bold flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                >
                  <span>{currentHostname || 'your-app.vercel.app'}</span>
                  {copiedKey === 'host' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1 text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">Steps to enable Google Sign-In:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 underline inline-flex items-center gap-0.5"
                    >
                      Firebase Console <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </li>
                  <li>
                    Navigate to <strong>Authentication</strong> → <strong>Settings</strong> tab → <strong>Authorized Domains</strong>
                  </li>
                  <li>
                    Click <strong>Add Domain</strong> and enter <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-bold">{currentHostname || 'your-app.vercel.app'}</code> (or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-bold">*.vercel.app</code>)
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Integration 2: Canvas LMS Proxy */}
          <div className="p-4 rounded-xl border border-orange-100 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-bold">
                <Layers className="w-4 h-4" />
                <span>2. Canvas LMS Calendar Feed Proxy</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Configured
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              Canvas LMS blocks direct browser requests due to CORS. We have configured <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">api/index.ts</code> and <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">vercel.json</code> to proxy <code className="font-mono">/api/canvas/proxy</code> via Vercel Serverless Functions automatically!
            </p>
          </div>

          {/* Integration 3: Gemini AI API Key */}
          <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>3. Gemini AI Features (Email Scanner, Quick Draft, Assistant)</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                Vercel Env Var
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              To enable server-side AI processing on Vercel:
            </p>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200/80 dark:border-amber-800/80 space-y-2 text-xs">
              <p className="text-slate-700 dark:text-slate-300">
                1. Go to your Vercel Project → <strong>Settings</strong> → <strong>Environment Variables</strong>
              </p>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800 font-mono text-xs">
                <div>
                  <span className="text-slate-500">Key: </span>
                  <span className="font-bold text-slate-900 dark:text-white">GEMINI_API_KEY</span>
                </div>
                <button
                  onClick={() => copyToClipboard('GEMINI_API_KEY', 'envkey')}
                  className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 transition-colors flex items-center gap-1 text-[11px]"
                >
                  <span>Copy Key</span>
                  {copiedKey === 'envkey' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                2. Paste your Gemini API key and redeploy.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Files added: <code className="font-mono text-slate-600 dark:text-slate-300">api/index.ts</code> & <code className="font-mono text-slate-600 dark:text-slate-300">vercel.json</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shadow-xs transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
