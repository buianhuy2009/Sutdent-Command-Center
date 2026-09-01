import { GoogleGenAI } from "@google/genai";
import { rateLimiter } from "./rateLimiter";
import { checkDailyQuota, incrementQuota, getClientGeminiApiKey, callGroqDirect, getClientGroqApiKey } from "./providers";

export async function callGemini(params: { contents:any; config?:any; model?:string }): Promise<string> {
  if (!checkDailyQuota()) throw new Error(`Daily quota reached (50/day). Try tomorrow or set own key.`);
  return rateLimiter.execute(async ()=>{
    incrementQuota();
    const clientKey=getClientGeminiApiKey();
    const targetModel=params.model||'gemini-2.0-flash';
    if(clientKey){
      try{
        const ai=new GoogleGenAI({apiKey:clientKey});
        const res=await ai.models.generateContent({model:targetModel, contents:params.contents, config:params.config});
        return res.text||'';
      } catch(e:any){ if(e?.status===429||e?.message?.includes('429')) throw e; console.warn('client Gemini failed fallback',e); }
    }
    try{
      const serverRes=await fetch('/api/gemini/generate',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({contents:params.contents, config:params.config, model:targetModel})});
      if(serverRes.ok){ const data=await serverRes.json(); return data.text||''; }
    } catch(e){ console.warn('server proxy failed',e); }
    try{
      let promptText='';
      if(typeof params.contents==='string') promptText=params.contents;
      else if(Array.isArray(params.contents)) promptText=params.contents.map((c:any)=> typeof c==='string'?c:c.text||'').join('\n');
      else if(params.contents?.text) promptText=params.contents.text;
      const isJson=params.config?.responseMimeType==='application/json';
      return await callGroqDirect(promptText||'Summarize academic task', isJson);
    }catch(e){ console.error('All providers failed',e); throw new Error('AI temporarily unavailable across providers. Check API key.'); }
  });
}

export function repairJsonString<T=any>(raw:string):T{
  let cleaned=raw.trim().replace(/^```(?:json)?/i,'').replace(/```$/i,'').trim();
  try{ return JSON.parse(cleaned); }catch{
    const firstBrace=cleaned.indexOf('{'); const firstBracket=cleaned.indexOf('[');
    let start=0, end=cleaned.length;
    if(firstBrace!==-1 && (firstBracket===-1 || firstBrace<firstBracket)){ start=firstBrace; end=cleaned.lastIndexOf('}')+1; }
    else if(firstBracket!==-1){ start=firstBracket; end=cleaned.lastIndexOf(']')+1; }
    const sliced=cleaned.slice(start,end);
    try{ return JSON.parse(sliced); }catch{ throw new Error(`Failed parse ${raw.slice(0,100)}`); }
  }
}

export async function testGeminiApiKey(key:string):Promise<boolean>{
  try{
    const ai=new GoogleGenAI({apiKey:key.trim()});
    const response=await ai.models.generateContent({model:'gemini-2.0-flash', contents:'Respond with "pong".'});
    return (response.text||'').toLowerCase().includes('pong');
  }catch{return false;}
}
