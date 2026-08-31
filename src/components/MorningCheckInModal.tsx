import React, { useState, useEffect } from 'react';
import {
  Sun,
  Target,
  Clock,
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface MorningCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onSaveIntention: (intention: string, targetHours: number) => void;
}

export const MorningCheckInModal: React.FC<MorningCheckInModalProps> = ({
  isOpen,
  onClose,
  userName = 'Student',
  onSaveIntention,
}) => {
  const [intention, setIntention] = useState('');
  const [targetHours, setTargetHours] = useState(3);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intention.trim()) return;
    onSaveIntention(intention.trim(), targetHours);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#1A1917] w-full max-w-md rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl p-6 space-y-5 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Daily Morning Check-in</h3>
              <p className="text-[10px] text-[#8C897F]">Set today's academic intention &amp; target</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#D97757]" />
              <span>What is your #1 priority goal today?</span>
            </label>
            <input
              type="text"
              required
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="e.g. Finish Physics Problem Set 4 &amp; revise Calculus derivatives"
              className="w-full px-3.5 py-2.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs text-[#141413] dark:text-[#FAF9F5] focus:outline-none focus:border-[#D97757]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D97757]" />
              <span>Deep Work Target Hours</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setTargetHours(hours)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    targetHours === hours
                      ? 'bg-[#D97757] text-white border-[#D97757] shadow-xs'
                      : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]'
                  }`}
                >
                  {hours} {hours === 1 ? 'Hour' : 'Hours'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!intention.trim()}
              className="w-full py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Lock In Today's Focus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
