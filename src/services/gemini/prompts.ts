export const PROMPTS = {
  autonomousAgent: (studentPrompt:string, appContext:any)=>`You are the Autonomous Operating System Agent for StudentOS. Student Request: "${studentPrompt}" Context: ${JSON.stringify(appContext||{})} Respond JSON {reply, actions}`,
  debugHandwrittenMath: `You are a Principal STEM Professor and Math Debugger. Analyze image... Respond JSON {fullLatex, hasError, errorLineIndex, errorDescription, socraticHint}`,
  deploySemester: (syllabus:any)=>`You are an Academic Operations Orchestrator. Parsed Syllabus: ${JSON.stringify(syllabus)} Respond JSON {createdEvents, createdNotes, createdDeckTitle, createdCards}`,
  feynmanThreeTiers: (concept:string)=>`Apply Feynman Technique to "${concept}" Respond JSON {concept, corePrinciple, tier1_eli5, tier2_highschool, tier3_undergrad, analogy}`,
};
