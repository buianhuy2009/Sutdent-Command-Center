import { GoogleGenAI } from "@google/genai";
let genAI=null;
function getGenAI(){ if(!genAI){ genAI=new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY||""}); } return genAI; }
const CANDIDATE_MODELS=[process.env.GEMINI_MODEL,"gemini-2.0-flash","gemini-2.0-flash-lite","gemini-1.5-flash"].filter(Boolean);
async function generateWithModelFallback(params){
  const ai=getGenAI(); let last=null;
  for(const model of CANDIDATE_MODELS){
    try{ const r=await ai.models.generateContent({model, contents: params.contents, config: params.config}); return r; }catch(e){ last=e; console.warn(`Model ${model} failed ${e.message}`); }
  }
  throw last||new Error("All models failed");
}
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
  if(req.method==="OPTIONS") return res.status(200).end();
  try{
    const {contents, config} = req.body||{};
    if(!contents) return res.status(400).json({error:"Missing contents"});
    const response=await generateWithModelFallback({contents, config});
    res.status(200).json({text: response.text||""});
  }catch(err){ console.error("generate error",err); res.status(500).json({error: err.message||"Generate failed", text:""}); }
}
