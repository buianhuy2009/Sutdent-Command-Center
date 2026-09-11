import React, { useMemo } from 'react';
import { GanttChart } from 'lucide-react';
import { Assignment, CanvasAssignment } from '../../types';
import { t, useLang } from '../../services/i18n';

export const DeadlineGanttWorkspace: React.FC<{ assignments: Assignment[]; canvasAssignments: CanvasAssignment[] }> = ({ assignments, canvasAssignments }) => {
  useLang();
  const mermaidCode = useMemo(() => {
    const all = [
      ...assignments.filter(a=>a.status!=='Done').map(a=> ({ name: a.assignmentName, due: a.dueDate, course: a.subject })),
      ...canvasAssignments.filter(c=>!c.isCompleted).map(c=> ({ name: c.name, due: c.dueAt, course: c.courseName })),
    ].slice(0, 12);
    if (all.length===0) return 'gantt\n title No deadlines\n dateFormat YYYY-MM-DD\n section Empty\n Task : 2026-09-01, 1d';
    const todayStr = new Date().toISOString().split('T')[0];
    const normDue = (d?: string) => (d ? d.split('T')[0] : todayStr);
    const dues = all.map(a => normDue(a.due));
    const minDue = dues.reduce((m, d) => (d < m ? d : m), dues[0]);
    const maxDue = dues.reduce((m, d) => (d > m ? d : m), dues[0]);
    const showToday = todayStr >= minDue && todayStr <= maxDue;
    let code = 'gantt\n title Deadline Radar Timeline\n dateFormat YYYY-MM-DD\n';
    const byCourse: Record<string, typeof all> = {};
    all.forEach(a=> { (byCourse[a.course] ||= []).push(a); });
    Object.entries(byCourse).forEach(([course, items])=>{
      code += ` section ${course}\n`;
      items.forEach(item=>{
        const due = normDue(item.due);
        const safe = item.name.replace(/:/g,' -').slice(0,30);
        const overdue = due < todayStr;
        code += overdue ? ` ${safe} :crit, ${due}, 1d\n` : ` ${safe} : ${due}, 1d\n`;
      });
    });
    if (showToday) code += ` section Today\n Today :milestone, ${todayStr}, 0d\n`;
    return code;
  }, [assignments, canvasAssignments]);
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
        <h2 className="text-lg font-bold flex items-center gap-2"><GanttChart className="w-5 h-5 text-[#D97757]" /> {t('gantt_title')}</h2>
        <p className="text-xs text-[#6B6860]">{t('gantt_sub')}</p>
        <pre className="mt-4 p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs font-mono whitespace-pre-wrap overflow-x-auto">{mermaidCode}</pre>
        <button onClick={()=>navigator.clipboard.writeText(mermaidCode)} className="mt-3 px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold">{t('gantt_copy')}</button>
      </div>
    </div>
  );
};
