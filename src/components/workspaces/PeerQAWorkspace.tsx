import React, { useState } from 'react';
import { MessageSquare, ShieldCheck, Send } from 'lucide-react';

export const PeerQAWorkspace: React.FC = () => {
  const [qs, setQs] = useState<any[]>(()=>{ try{ const r=localStorage.getItem('scc_peer_qa_v1'); return r?JSON.parse(r):[];}catch{return[];}});
  const [input, setInput] = useState('');
  const [course, setCourse] = useState('General');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const ask = () => {
    if (!input.trim()) return;
    // AI moderation stub — filter via simple word list
    const bad = /spam|scam|abuse/i.test(input);
    if (bad) { alert('AI moderation blocked this question.'); return; }
    const next = [...qs, { id: Date.now().toString(), course, question: input.trim(), anonymous: true, replies: [] }];
    setQs(next); setInput(''); try{ localStorage.setItem('scc_peer_qa_v1', JSON.stringify(next));}catch{}
  };
  const reply = (qid: string) => {
    const text = (drafts[qid] || '').trim();
    if (!text) return;
    const next = qs.map(q=>q.id===qid?{...q, replies:[...(Array.isArray(q.replies)?q.replies:[]), { id: Date.now().toString(), text, createdAt: new Date().toISOString() }]}:q);
    setQs(next); setDrafts(d=>({...d, [qid]:''})); try{ localStorage.setItem('scc_peer_qa_v1', JSON.stringify(next));}catch{}
  };
  const replyText = (r: any): string => typeof r === 'string' ? r : (r?.text ?? r?.body ?? r?.content ?? '');
  const replyTime = (r: any): string => (typeof r === 'object' && r) ? (r.createdAt ?? r.created ?? r.timestamp ?? '') : '';
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-card">
        <h2 className="text-lg font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#D97757]" /> Peer Q&A — Piazza-style</h2>
        <p className="text-xs text-[#6B6860]">Anonymous course Q&A with AI moderation. Ask questions, peers answer, AI flags spam.</p>
        <div className="mt-4 space-y-2">
          <input value={course} onChange={e=>setCourse(e.target.value)} placeholder="Course e.g. AP Chemistry" className="w-full px-3 py-2 text-sm bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl" />
          <div className="flex gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()} placeholder="Ask anonymously..." className="flex-1 px-3 py-2 text-sm bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl" />
            <button onClick={ask} className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Ask</button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {qs.slice().reverse().map(q=>(
          <div key={q.id} className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27]">
            <div className="flex items-center gap-2 text-xs font-bold"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">{q.course}</span> Anonymous <ShieldCheck className="w-3 h-3 text-emerald-600" /></div>
            <p className="text-sm mt-1">{q.question}</p>
            <div className="mt-2 space-y-1 pl-3 border-l-2 border-[#EDE9DD] dark:border-[#2C2B27]">
              {(Array.isArray(q.replies)?q.replies:[]).map((r:any)=>(
                <div key={r?.id ?? `${replyText(r)}-${replyTime(r)}`} className="text-xs">
                  <p className="text-sm">{replyText(r)}{replyTime(r) && <span className="ml-2 text-[10px] text-[#6B6860]">{new Date(replyTime(r)).toLocaleString()}</span>}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input value={drafts[q.id] || ''} onChange={e=>setDrafts(d=>({...d, [q.id]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&reply(q.id)} placeholder="Write a reply..." className="flex-1 px-3 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl" />
              <button onClick={()=>reply(q.id)} className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold">Reply</button>
            </div>
          </div>
        ))}
        {qs.length===0 && <p className="text-xs text-[#6B6860] text-center py-8">No questions yet — be the first to ask!</p>}
      </div>
    </div>
  );
};
