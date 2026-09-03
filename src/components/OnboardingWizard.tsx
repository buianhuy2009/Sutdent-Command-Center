import React, { useState } from 'react';
import { CheckCircle2, Link2, LayoutGrid, ArrowRight, Play } from 'lucide-react';

/**
 * 60-seconds-to-Aha: 3 steps only.
 * 1) Connect Google (1 click) 2) Paste Canvas feed (video + test) 3) Pick 3 pinned apps.
 * Sample data toggle is explicit — never auto-populate demo that looks real.
 */
export const OnboardingWizard: React.FC<{
  onConnectGoogle: () => void;
  onTestCanvas: (feedUrl: string) => Promise<boolean>;
  onSaveCanvas: (feedUrl: string) => void;
  availableApps: { id: string; name: string }[];
  initialPinned: string[];
  onFinish: (pinned: string[], useSampleData: boolean) => void;
  onSkip: () => void;
}> = ({ onConnectGoogle, onTestCanvas, onSaveCanvas, availableApps, initialPinned, onFinish, onSkip }) => {
  const [step, setStep] = useState(0);
  const [feedUrl, setFeedUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState<boolean | null>(null);
  const [pinned, setPinned] = useState<string[]>(initialPinned.slice(0, 3));
  const [useSampleData, setUseSampleData] = useState(false);

  const togglePin = (id: string) => {
    setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(0, 5)));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Get started in 60 seconds">
      <div className="w-full max-w-lg rounded-3xl p-6 space-y-4" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="flex items-center gap-2 text-xs font-bold opacity-60">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ backgroundColor: i <= step ? 'var(--terracotta)' : 'var(--line)', color: i <= step ? '#fff' : undefined }}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </span>
              {i < 2 && <span className="w-6 h-px bg-current opacity-30" />}
            </span>
          ))}
          <span className="ml-auto">Step {step + 1} of 3 • ~60 sec</span>
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold">Connect Google in 1 click</h2>
            <p className="text-xs opacity-70 leading-relaxed">Calendar, Gmail and Drive power deadlines, email scans and files. Read-only — we never send mail on your behalf. Revoke anytime in Settings.</p>
            <button onClick={() => { onConnectGoogle(); setStep(1); }} className="w-full px-4 py-3 text-sm font-bold text-white rounded-2xl min-h-[48px]" style={{ backgroundColor: 'var(--terracotta)' }}>
              Connect Google
            </button>
            <button onClick={() => setStep(1)} className="w-full text-xs font-semibold opacity-60 min-h-[44px]">Skip for now</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold">Paste your Canvas feed</h2>
            <p className="text-xs opacity-70">Canvas → Calendar → copy the Feed URL. <a className="underline" href="https://community.canvaslms.com/t5/Student-Guide/tkb-p/student" target="_blank" rel="noreferrer">Watch the 1-min video</a></p>
            <input value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} placeholder="https://canvas…/feeds/calendars/…ics"
              className="w-full px-3 py-2.5 text-xs rounded-xl border bg-transparent" style={{ borderColor: 'var(--line)' }} aria-label="Canvas calendar feed URL" />
            <div className="flex gap-2">
              <button disabled={!feedUrl || testing} onClick={async () => { setTesting(true); const ok = await onTestCanvas(feedUrl).catch(() => false); setTestOk(ok); setTesting(false); }}
                className="flex-1 px-3 py-2.5 text-xs font-bold rounded-xl border min-h-[44px] inline-flex items-center justify-center gap-1" style={{ borderColor: 'var(--line)' }}>
                <Play className="w-3.5 h-3.5" /> {testing ? 'Testing…' : 'Test feed'}
              </button>
              <button disabled={!feedUrl} onClick={() => { onSaveCanvas(feedUrl); setStep(2); }}
                className="flex-1 px-3 py-2.5 text-xs font-bold text-white rounded-xl min-h-[44px]" style={{ backgroundColor: 'var(--terracotta)' }}>
                Save & continue
              </button>
            </div>
            {testOk === true && <p className="text-xs text-emerald-600 font-semibold">✓ Feed works — assignments found.</p>}
            {testOk === false && <p className="text-xs text-rose-600 font-semibold">That feed didn't return events. Check the URL and try again.</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold">Pick your pinned apps</h2>
            <p className="text-xs opacity-70">Choose up to 5. You can change these anytime in the App Store.</p>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
              {availableApps.map((a) => (
                <button key={a.id} onClick={() => togglePin(a.id)} aria-pressed={pinned.includes(a.id)}
                  className="px-3 py-2.5 text-xs font-bold rounded-xl border text-left min-h-[44px] flex items-center gap-2"
                  style={{ borderColor: pinned.includes(a.id) ? 'var(--terracotta)' : 'var(--line)', backgroundColor: pinned.includes(a.id) ? 'var(--accent-soft)' : undefined }}>
                  {pinned.includes(a.id) ? <CheckCircle2 className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4 opacity-50" />}
                  {a.name}
                </button>
              ))}
            </div>
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={useSampleData} onChange={(e) => setUseSampleData(e.target.checked)} className="mt-0.5 w-4 h-4" />
              <span><strong>Show sample data</strong> (clearly labeled DEMO) so I can explore before connecting anything.</span>
            </label>
            <button onClick={() => onFinish(pinned, useSampleData)} className="w-full px-4 py-3 text-sm font-bold text-white rounded-2xl min-h-[48px] inline-flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--terracotta)' }}>
              Start using StudentOS <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex justify-between text-xs">
          {step > 0
            ? <button onClick={() => setStep(step - 1)} className="font-semibold opacity-60 min-h-[44px] px-2">← Back</button>
            : <span />}
          <button onClick={onSkip} className="opacity-60 min-h-[44px] px-2">Skip tour</button>
        </div>
        <p className="text-[11px] opacity-50 flex items-center gap-1"><Link2 className="w-3 h-3" /> Deep links like ?w=tracker keep working even during onboarding.</p>
      </div>
    </div>
  );
};
