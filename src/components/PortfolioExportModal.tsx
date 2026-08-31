import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  BookOpen,
  Award,
} from 'lucide-react';
import { Assignment } from '../types';

interface PortfolioExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  completedAssignments: Assignment[];
}

export const PortfolioExportModal: React.FC<PortfolioExportModalProps> = ({
  isOpen,
  onClose,
  userName = 'Student',
  completedAssignments = [],
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#1A1917] w-full max-w-2xl rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">1-Page Academic Portfolio Export</h3>
              <p className="text-[10px] text-[#8C897F]">Formatted summary of completed coursework &amp; academic deliverables</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Sheet View */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FAF9F5] dark:bg-[#141413]">
          <div
            ref={printAreaRef}
            className="bg-white text-black p-8 rounded-2xl border border-[#DFDACB] shadow-sm space-y-6 max-w-xl mx-auto font-serif"
          >
            {/* Sheet Header */}
            <div className="border-b-2 border-black pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold font-sans tracking-tight text-black">{userName}</h1>
                <p className="text-xs font-sans text-stone-600">Student Academic Record &amp; Portfolio</p>
              </div>
              <div className="text-right font-sans text-[11px] text-stone-500">
                <p>Term Record</p>
                <p>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-3 font-sans text-center">
              <div className="p-3 bg-stone-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Deliverables Completed</span>
                <span className="text-lg font-bold text-black">{completedAssignments.length}</span>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Verified Status</span>
                <span className="text-lg font-bold text-emerald-700">100% In Good Standing</span>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Academic Integrity</span>
                <span className="text-lg font-bold text-stone-800">Direct Submissions</span>
              </div>
            </div>

            {/* Completed Coursework Index */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold font-sans uppercase tracking-wider text-stone-700 border-b pb-1">
                Completed Coursework &amp; Submissions
              </h2>
              {completedAssignments.length === 0 ? (
                <p className="text-xs italic text-stone-500 font-sans py-2">
                  No completed tasks marked yet in the assignment tracker.
                </p>
              ) : (
                <div className="space-y-1.5 font-sans">
                  {completedAssignments.slice(0, 15).map((task, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800">{task.subject}:</span>
                        <span className="text-stone-700">{task.assignmentName}</span>
                      </div>
                      <span className="text-[11px] text-stone-500 font-mono">{task.dueDate || 'Completed'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-stone-200 text-[10px] font-sans text-stone-400 flex items-center justify-between">
              <span>Generated via StudentOS Academic Center</span>
              <span>Self-Certified Portfolio Record</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#DFDACB] dark:border-[#2C2B27] bg-[#FAF9F5] dark:bg-[#1F1E1B] flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
};
