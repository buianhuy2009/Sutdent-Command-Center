import React, { useMemo } from 'react';
import { GanttChart } from 'lucide-react';
import { Assignment, CanvasAssignment } from '../../types';

export const DeadlineGanttWorkspace: React.FC<{ assignments: Assignment[]; canvasAssignments: CanvasAssignment[] }> = ({ assignments, canvasAssignments }) => {
  const mermaidCode = useMemo(() => {
    const all = [
      ...assignments.filter(a=>a.status!=='Done').map(a=> ({ name: a.assignmentName, due: a.dueDate, course: a.subject })),
      ...canvasAssignments.filter(c=>!c.isCompleted).map(c=> ({ name: c.name, due: c.dueAt, course: c.courseName })),
    ].slice(0, 12);
    if (all.length===0) return 'gantt\n title No deadlines\n dateFormat YYYY-MM-DD\n section Empty\n Task : 2026-09-01, 1d';
    let code = 'gantt\n title Deadline Radar Timeline\n dateFormat YYYY-MM-DD\n';
    const byCourse: Record<string, typeof all> = {};
    all.forEach(a=> { (byCourse[a.course] ||= []).push(a); });
    Object.entries(byCourse).forEach(([course, items])=>{
      code += ` section ${course}\n`;
      items.forEach(item=>{
        const due = item.due ? item.due.split('T')[0] : new Date().toISOString().split('T')[0];
        const safe = item.name.replace(/:/g,' -').slice(0,30);
        code += ` ${safe} : ${due}, 1d\n`;
      });
    });
    return code;
  }, [assignments, canvasAssignments]);
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
        <h2 className="text-lg font-bold flex items-center gap-2"><GanttChart className="w-5 h-5 text-[#D97757]" /> Deadline Radar — Gantt Timeline</h2>
        <p className="text-xs text-[#6B6860]">Auto-generated Mermaid Gantt from assignments + canvasAssignments. Copy to MermaidWorkspace for rendering.</p>
        <pre className="mt-4 p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-mono whitespace-pre-wrap overflow-x-auto">{mermaidCode}</pre>
        <button onClick={()=>navigator.clipboard.writeText(mermaidCode)} className="mt-3 px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold">Copy Mermaid code</button>
      </div>
    </div>
  );
};
