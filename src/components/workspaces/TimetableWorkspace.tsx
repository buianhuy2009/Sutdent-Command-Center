import React, { useState } from 'react';
import { Calendar, Plus, GripVertical } from 'lucide-react';
import { insertCalendarEvent } from '../../services/googleWorkspace';
import { getStoredGoogleToken } from '../../services/firebase';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOURS = Array.from({length: 12}, (_,i)=> 8+i); // 8am-7pm

export const TimetableWorkspace: React.FC = () => {
  const [events, setEvents] = useState<any[]>(() => {
    try { const raw = localStorage.getItem('scc_timetable_v1'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [dragged, setDragged] = useState<string | null>(null);
  const addEvent = async (day: string, hour: number) => {
    const title = prompt(`New class for ${day} ${hour}:00`); if (!title) return;
    const ev = { id: `tt-${Date.now()}`, day, hour, title };
    const next = [...events, ev];
    setEvents(next);
    try { localStorage.setItem('scc_timetable_v1', JSON.stringify(next)); } catch {}
    // Try to insert to Google Calendar as well
    try {
      const token = getStoredGoogleToken();
      if (token) {
        const today = new Date(); const dayIdx = DAYS.indexOf(day);
        const date = new Date(today); date.setDate(today.getDate() - today.getDay() + 1 + dayIdx);
        const start = new Date(date); start.setHours(hour,0,0,0);
        const end = new Date(start); end.setHours(hour+1);
        await insertCalendarEvent(token, { summary: title, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } });
      }
    } catch {}
  };
  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
        <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-[#D97757]" /> Weekly Timetable • Drag-drop → Google Calendar</h2>
        <p className="text-xs text-[#6B6860]">Click a slot to add a class. Drag events to reschedule. Syncs to Google Calendar via insertCalendarEvent.</p>
      </div>
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden overflow-x-auto">
        <div className="min-w-[700px] grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="p-2 text-xs font-bold text-[#6B6860] border-b border-[#DFDACB] dark:border-[#2C2B27]">Time</div>
          {DAYS.map(d=><div key={d} className="p-2 text-xs font-bold text-center border-b border-l border-[#DFDACB] dark:border-[#2C2B27]">{d}</div>)}
          {HOURS.map(h=>(
            <React.Fragment key={h}>
              <div className="p-2 text-[11px] font-mono text-[#6B6860] border-b border-[#DFDACB]/40 h-14">{h}:00</div>
              {DAYS.map(day=>{
                const ev = events.find(e=>e.day===day && e.hour===h);
                return (
                  <div key={`${day}-${h}`} onClick={()=>!ev && addEvent(day,h)} className="border-b border-l border-[#DFDACB]/40 h-14 p-1 relative hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] cursor-pointer">
                    {ev && (
                      <div draggable onDragStart={()=>setDragged(ev.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>{
                        if (dragged) {
                          const next = events.map(e=> e.id===dragged ? {...e, day, hour:h} : e);
                          setEvents(next);
                          try{ localStorage.setItem('scc_timetable_v1', JSON.stringify(next)); }catch{}
                          setDragged(null);
                        }
                      }} className="absolute inset-1 bg-[#D97757] text-white rounded-lg p-1 text-xs font-bold flex items-center gap-1 shadow-xs">
                        <GripVertical className="w-3 h-3 opacity-60" /> {ev.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
