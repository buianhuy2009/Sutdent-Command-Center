import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  getClientGeminiApiKey,
  setClientGeminiApiKey,
  testGeminiApiKey,
} from '../services/gemini';
import { vaultSet, vaultGet, vaultExists, vaultClear } from '../services/vault';

interface GeminiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [vaultPin, setVaultPin] = useState('');
  const [vaultLocked, setVaultLocked] = useState(vaultExists());

  useEffect(() => {
    if (isOpen) {
      const saved = getClientGeminiApiKey();
      setApiKey(saved);
      setTestStatus(saved ? 'success' : 'idle');
      setStatusMessage(saved ? 'API Key configured in local storage.' : '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setClientGeminiApiKey(apiKey);
    setTestStatus('idle');
    setStatusMessage('Key saved locally.');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestStatus('failed');
      setStatusMessage('Please enter an API key first.');
      return;
    }

    setIsTesting(true);
    setTestStatus('idle');
    setStatusMessage('Testing connection to Gemini 2.5 Flash...');

    const ok = await testGeminiApiKey(apiKey);
    setIsTesting(false);
    if (ok) {
      setTestStatus('success');
      setStatusMessage('Connection Verified! Ready for deep multimodal & schema inference.');
      setClientGeminiApiKey(apiKey);
    } else {
      setTestStatus('failed');
      setStatusMessage('Connection failed. Please check your API key.');
    }
  };

  const handleClear = () => {
    setApiKey('');
    setClientGeminiApiKey('');
    setTestStatus('idle');
    setStatusMessage('API Key removed.');
  };

  return (
    <div className="fixed inset-0 bg-[#141413]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl max-w-lg w-full border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-[#FAF9F5] dark:bg-[#1F1E1B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-[#D97757] to-rose-500 text-white flex items-center justify-center shadow-md shadow-[#D97757]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                AI Engine &amp; API Key Settings
              </h3>
              <p className="text-xs text-[#8C897F]">
                Dual-Provider Engine: Google Gemini + Groq LLaMA 3.3 70B Fallback
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8C897F] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start gap-2.5 text-xs text-[#5C5A54] dark:text-[#B5B2A8]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-[#141413] dark:text-[#FAF9F5] block mb-0.5">
                Encrypted Vault • PBKDF2 + AES-GCM
              </span>
              {vaultLocked ? 'Vault locked: keys encrypted with your PIN. Enter PIN to decrypt.' : 'Set a PIN to encrypt your Gemini/Groq keys locally. Protects against XSS & extension reads.'}
              <div className="flex items-center gap-2 mt-2">
                <input type="password" value={vaultPin} onChange={e=>setVaultPin(e.target.value)} placeholder="Vault PIN (min 4 chars)" className="px-2 py-1 text-xs bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg w-40" />
                {!vaultLocked ? (
                  <button onClick={async()=>{
                    if(vaultPin.length<4){ setStatusMessage('PIN too short'); setTestStatus('failed'); return; }
                    await vaultSet(vaultPin, { gemini: apiKey, groq: localStorage.getItem('scc_groq_api_key')||'' });
                    setVaultLocked(true); setStatusMessage('Vault encrypted & locked. Raw keys removed from localStorage.'); setTestStatus('success');
                    localStorage.removeItem('scc_gemini_api_key'); localStorage.removeItem('scc_groq_api_key');
                  }} className="px-2 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg">Encrypt & Lock</button>
                ) : (
                  <>
                    <button onClick={async()=>{
                      const data = await vaultGet(vaultPin);
                      if(!data){ setStatusMessage('Wrong PIN or vault corrupt'); setTestStatus('failed'); return; }
                      if(data.gemini) { setApiKey(data.gemini); setClientGeminiApiKey(data.gemini); }
                      if(data.groq) try{ localStorage.setItem('scc_groq_api_key', data.groq); }catch{}
                      setVaultLocked(false); setStatusMessage('Vault unlocked & keys restored to session.'); setTestStatus('success');
                    }} className="px-2 py-1 text-xs font-bold bg-[#D97757] text-white rounded-lg">Unlock</button>
                    <button onClick={()=>{ vaultClear(); setVaultLocked(false); setStatusMessage('Vault cleared.'); setTestStatus('idle'); }} className="px-2 py-1 text-xs text-rose-600 border border-rose-200 rounded-lg">Clear Vault</button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
              Google Gemini API Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-9 pr-10 py-2.5 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Test Status Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testStatus === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : testStatus === 'failed'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              }`}
            >
              {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
              {testStatus === 'failed' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              {testStatus === 'idle' && <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />}
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between text-xs">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[#D97757] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Get a free API key at Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-600 hover:underline font-medium cursor-pointer"
              >
                Remove Key
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleTest}
            disabled={isTesting || !apiKey.trim()}
            className="px-4 py-2 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#D97757]' : ''}`} />
            <span>{isTesting ? 'Verifying...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};
