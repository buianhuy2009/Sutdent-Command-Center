import React, { useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X, ExternalLink, Undo2 } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  onUndo?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps & { onUndo?: any }> = ({ toasts, onDismiss, onUndo }) => {
  if (toasts.length === 0) return null;
  const timersRef = useRef<Map<string, number>>(new Map());

  const pause = (id: string) => {
    const t = timersRef.current.get(id);
    if (t) clearTimeout(t);
  };
  const resume = (id: string) => {
    // resume via parent timeout — placeholder; parent handles dismiss via setTimeout
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          id={`toast-${toast.id}`}
          onMouseEnter={() => pause(toast.id)}
          onMouseLeave={() => resume(toast.id)}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800/80 text-emerald-100'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-800/80 text-rose-100'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 border-amber-800/80 text-amber-100'
              : 'bg-slate-900/95 border-slate-700 text-slate-100'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold tracking-tight">{toast.title}</h4>
            {toast.message && (
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed break-words">{toast.message}</p>
            )}
            {toast.actionUrl && (
              <a
                href={toast.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium mt-1.5 underline hover:opacity-80"
              >
                {toast.actionLabel || 'Open Link'}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {(toast as any).undoLabel && onUndo && (
              <button onClick={() => onUndo(toast.id)} className="inline-flex items-center gap-1 text-xs font-bold mt-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg">
                <Undo2 className="w-3 h-3" /> {(toast as any).undoLabel}
              </button>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
