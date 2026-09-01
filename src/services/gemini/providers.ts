export function getClientGeminiApiKey(): string {
  try {
    const sess = sessionStorage.getItem('scc_gemini_api_key_session');
    if (sess) return sess;
    return localStorage.getItem('scc_gemini_api_key') || '';
  } catch { return ''; }
}
export function setClientGeminiApiKey(key: string, opts?: { sessionOnly?: boolean }): void {
  try {
    const trimmed = key.trim();
    if (!trimmed) { localStorage.removeItem('scc_gemini_api_key'); sessionStorage.removeItem('scc_gemini_api_key_session'); return; }
    if (opts?.sessionOnly) { sessionStorage.setItem('scc_gemini_api_key_session', trimmed); localStorage.removeItem('scc_gemini_api_key'); }
    else { localStorage.setItem('scc_gemini_api_key', trimmed); sessionStorage.removeItem('scc_gemini_api_key_session'); }
  } catch {}
}
export function getClientGroqApiKey(): string { try { return localStorage.getItem('scc_groq_api_key')||''; } catch { return ''; } }
export function setClientGroqApiKey(key: string): void { try { localStorage.setItem('scc_groq_api_key', key.trim()); } catch {} }

export async function callGroqDirect(promptText: string, jsonMode: boolean=false): Promise<string> {
  const groqKey = getClientGroqApiKey();
  if (!groqKey) throw new Error('No Groq key');
  const tryModel = async (model: string) => {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST', headers:{ Authorization:`Bearer ${groqKey}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ model, messages:[{role:'user', content:promptText}], temperature:0.3, response_format: jsonMode ? {type:'json_object'}:undefined })
    });
    if(!res.ok) throw new Error(`Groq ${model} error ${res.statusText}`);
    const data=await res.json(); return data.choices?.[0]?.message?.content||'';
  };
  try { return await tryModel('llama-3.3-70b-versatile'); }
  catch(e){ console.warn('Groq 70B failed fallback',e); return await tryModel('llama-3.1-8b-instant'); }
}

// Daily quota — client only, server should enforce via Redis
const DAILY_QUOTA_KEY='scc_gemini_daily_quota_v1';
export const DAILY_QUOTA_LIMIT=50;
export function checkDailyQuota():boolean{ try{ const today=new Date().toISOString().slice(0,10); const raw=localStorage.getItem(DAILY_QUOTA_KEY); const data=raw?JSON.parse(raw):{date:today,count:0}; if(data.date!==today) return true; return data.count<DAILY_QUOTA_LIMIT; }catch{return true;}}
export function incrementQuota():void{ try{ const today=new Date().toISOString().slice(0,10); const raw=localStorage.getItem(DAILY_QUOTA_KEY); const data=raw?JSON.parse(raw):{date:today,count:0}; if(data.date!==today) {localStorage.setItem(DAILY_QUOTA_KEY, JSON.stringify({date:today,count:1})); return;} localStorage.setItem(DAILY_QUOTA_KEY, JSON.stringify({date:today,count:(data.count||0)+1})); }catch{}}
export function getGeminiQuotaStatus(){ try{ const today=new Date().toISOString().slice(0,10); const raw=localStorage.getItem(DAILY_QUOTA_KEY); const data=raw?JSON.parse(raw):{date:today,count:0}; const used=data.date===today?(data.count||0):0; return {used, limit:DAILY_QUOTA_LIMIT, remaining:Math.max(0,DAILY_QUOTA_LIMIT-used)};}catch{return {used:0,limit:DAILY_QUOTA_LIMIT,remaining:DAILY_QUOTA_LIMIT};}}
