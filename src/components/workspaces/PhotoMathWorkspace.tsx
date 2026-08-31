import React, { useState } from 'react';
import { Zap, UploadCloud, Sparkles, Copy, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { scribbleToLatex, debugHandwrittenMath } from '../../services/gemini';
import { MathDebugResult } from '../../types';

export const PhotoMathWorkspace: React.FC = () => {
  const [scribbleImage, setScribbleImage] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [extractedLatex, setExtractedLatex] = useState<{ latex: string; explanation: string } | null>(null);
  const [mathDebugResult, setMathDebugResult] = useState<MathDebugResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScribbleImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConvert = async () => {
    if (!scribbleImage) return;
    setIsConverting(true);
    try {
      const [latexRes, debugRes] = await Promise.all([
        scribbleToLatex(scribbleImage),
        debugHandwrittenMath(scribbleImage),
      ]);
      setExtractedLatex(latexRes);
      setMathDebugResult(debugRes);
    } catch (err) {
      console.error('Error processing math image:', err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = () => {
    if (!extractedLatex) return;
    navigator.clipboard.writeText(extractedLatex.latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-yellow-500 text-white flex items-center justify-center shadow-md shadow-yellow-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Photo Math OCR &amp; Step Checker
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800">
                Vision OCR
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Upload handwritten math notes, extract LaTeX, and check derivation arithmetic
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
          {scribbleImage ? (
            <div className="space-y-4 w-full">
              <img
                src={scribbleImage}
                alt="Handwritten math"
                className="max-h-64 mx-auto rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] object-contain shadow-xs"
              />
              <div className="flex justify-center gap-2">
                <label className="px-4 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs font-bold cursor-pointer">
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isConverting ? 'Reading math...' : 'Extract & Verify'}</span>
                </button>
              </div>
            </div>
          ) : (
            <label className="w-full border-2 border-dashed border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors space-y-3">
              <UploadCloud className="w-10 h-10 text-[#D97757]" />
              <div>
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block">
                  Click or drag photo of handwritten equations
                </span>
                <span className="text-[10px] text-[#8C897F] block mt-0.5">
                  Supports PNG, JPG, JPEG notes from your phone or camera
                </span>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Results Area */}
        <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F] block mb-3">
              Extracted LaTeX &amp; Arithmetic Analysis
            </span>

            {extractedLatex ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#8C897F] uppercase">
                      LaTeX Formula
                    </span>
                    <button
                      onClick={handleCopy}
                      className="text-xs text-[#D97757] font-bold hover:underline flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-[#D97757] overflow-x-auto whitespace-pre-wrap">
                    {extractedLatex.latex}
                  </pre>
                </div>

                {mathDebugResult && (
                  <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    mathDebugResult.hasError
                      ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      {mathDebugResult.hasError ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      <span>{mathDebugResult.hasError ? 'Calculation Issue Detected' : 'All Steps Algebraically Valid'}</span>
                    </div>
                    <p className="leading-relaxed">
                      {mathDebugResult.errorDescription || mathDebugResult.socraticHint || 'All derivation lines match algebra rules.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-[#8C897F]">
                Upload an equation image to see extracted LaTeX and step verification.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
