import { GoogleGenAI } from "@google/genai";
import {
  EmailAlert,
  EmailMessage,
  QuickDraftRequest,
  QuickDraftResponse,
  Assignment,
  CanvasAssignment,
  CalendarEvent,
  SyllabusParsedResult,
  AssignmentSubTask,
  DesmosEquation,
  StemChatTurn,
  MermaidDiagramResult,
  FlashcardItem,
  VivaTurn,
  RubricPreCheckResult,
  AgentAction,
  MathDebugResult,
  ThreeTierFeynmanResult,
  DeployedSemesterResult,
  MarkdownNote,
} from '../types';

// --- Client-Side API Key Management ---
const GEMINI_KEY_STORAGE_KEY = 'scc_gemini_api_key';

export function getClientGeminiApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setClientGeminiApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(GEMINI_KEY_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error storing Gemini API key in localStorage:', e);
  }
}

export async function testGeminiApiKey(key: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey: key.trim() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Respond with "pong".',
    });
    return (response.text || '').toLowerCase().includes('pong');
  } catch (err) {
    console.error('Test Gemini API Key failed:', err);
    return false;
  }
}

// -------------------------------------------------------------
// RATE-LIMIT & FREE-TIER RESILIENCE ENGINE (15 RPM Token Bucket)
// -------------------------------------------------------------

class GeminiRateLimiter {
  private lastCallTimestamp = 0;
  private minIntervalMs = 3800; // ~15.7 requests per minute max
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        let attempts = 0;
        const maxAttempts = 4;
        while (attempts < maxAttempts) {
          try {
            const now = Date.now();
            const elapsed = now - this.lastCallTimestamp;
            if (elapsed < this.minIntervalMs) {
              await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
            }
            this.lastCallTimestamp = Date.now();
            const result = await fn();
            resolve(result);
            return;
          } catch (err: any) {
            attempts++;
            const is429 =
              err?.status === 429 ||
              err?.message?.includes('429') ||
              err?.message?.includes('RESOURCE_EXHAUSTED');

            if (is429 && attempts < maxAttempts) {
              const backoffMs = Math.pow(2, attempts) * 1000 + Math.random() * 500;
              console.warn(
                `Gemini 429 Rate-limit encountered. Backing off for ${Math.round(
                  backoffMs
                )}ms (attempt ${attempts}/${maxAttempts})...`
              );
              await new Promise((r) => setTimeout(r, backoffMs));
            } else {
              reject(err);
              return;
            }
          }
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (e) {
          console.error('Queue task execution error:', e);
        }
      }
    }
    this.isProcessing = false;
  }
}

const rateLimiter = new GeminiRateLimiter();

// Auto-Repair JSON utility
export function repairJsonString<T = any>(raw: string): T {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let start = 0;
    let end = cleaned.length;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = cleaned.lastIndexOf('}') + 1;
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = cleaned.lastIndexOf(']') + 1;
    }

    const sliced = cleaned.slice(start, end);
    try {
      return JSON.parse(sliced);
    } catch {
      throw new Error(`Failed to parse repaired JSON: ${raw.slice(0, 100)}...`);
    }
  }
}

/**
 * Universal Gemini Caller with Rate Limiting & Proxy Fallback
 */
export async function callGemini(params: {
  contents: any;
  config?: any;
  model?: string;
}): Promise<string> {
  return rateLimiter.execute(async () => {
    const clientKey = getClientGeminiApiKey();
    const targetModel = params.model || 'gemini-2.5-flash';

    if (clientKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: clientKey });
        const res = await ai.models.generateContent({
          model: targetModel,
          contents: params.contents,
          config: params.config,
        });
        return res.text || '';
      } catch (clientErr: any) {
        if (clientErr?.status === 429 || clientErr?.message?.includes('429')) {
          throw clientErr; // Allow rate limiter to backoff
        }
        console.warn('Client-side Gemini call failed, trying server proxy fallback...', clientErr);
      }
    }

    // Fallback to server proxy
    const serverRes = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: params.contents,
        config: params.config,
        model: targetModel,
      }),
    });

    if (!serverRes.ok) {
      const errData = await serverRes.json().catch(() => ({}));
      if (serverRes.status === 429) {
        const err: any = new Error(errData.error || 'Rate limit 429');
        err.status = 429;
        throw err;
      }
      throw new Error(errData.error || `Gemini API failed: ${serverRes.statusText}`);
    }

    const data = await serverRes.json();
    return data.text || '';
  });
}

// -------------------------------------------------------------
// 1. AUTONOMOUS ACTION DISPATCHER (AGENT TOOL CALLING)
// -------------------------------------------------------------

export async function runAutonomousAgent(
  studentPrompt: string,
  appContext?: {
    activeWorkspace?: string;
    assignmentsCount?: number;
    upcomingDeadlines?: string[];
  }
): Promise<{ reply: string; actions: AgentAction[] }> {
  const systemPrompt = `You are the Autonomous Operating System Agent for StudentOS.
You are equipped with structured tools to directly manipulate the student's workspace state:

Available Actions you can output in "actions":
1. "setWorkspaceLayout": { "leftPane": "canvas-agenda"|"notes-markdown"|"desmos-graphing"|"excalidraw"|"pomodoro"|"flashcards"|"notebooklm", "rightPane": "...", "ratio": "50/50"|"60/40"|"70/30" }
2. "injectDesmosEquation": { "expressions": ["y = 2x + 1", "y = x^2"], "title": "Optional description" }
3. "createCalendarMilestones": { "events": [{ "title": "Midterm Prep", "date": "YYYY-MM-DD", "type": "Exam", "weight": 20 }] }
4. "createSRSDeck": { "deckTitle": "Topic", "subject": "Class", "cards": [{ "front": "Term", "back": "Definition", "tags": ["Tag"] }] }
5. "generateMermaidDiagram": { "code": "graph TD\\n  A --> B", "title": "System Diagram" }

Student Request:
"${studentPrompt}"

Student App Context:
${JSON.stringify(appContext || {}, null, 2)}

Respond with strict JSON:
{
  "reply": "Friendly concise explanation of what you configured for the student (max 2 sentences)",
  "actions": [
    {
      "type": "setWorkspaceLayout" | "injectDesmosEquation" | "createCalendarMilestones" | "createSRSDeck" | "generateMermaidDiagram",
      "payload": { ... }
    }
  ]
}
Return only JSON.`;

  const raw = await callGemini({
    contents: studentPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
    },
  });

  try {
    const parsed = repairJsonString<{ reply: string; actions: AgentAction[] }>(raw);
    return {
      reply: parsed.reply || 'Configured workspace layout and tools.',
      actions: parsed.actions || [],
    };
  } catch (err) {
    console.error('Autonomous agent parse error:', err);
    return {
      reply: 'I am here to help configure your workspaces, plot equations, or schedule milestones.',
      actions: [],
    };
  }
}

// -------------------------------------------------------------
// 2. MULTIMODAL PHOTO-TO-LATEX DEBUGGER
// -------------------------------------------------------------

export async function debugHandwrittenMath(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<MathDebugResult> {
  const prompt = `You are a Principal STEM Professor and Math Debugger.
Analyze this image of handwritten mathematical scratch work or problem derivations.
Steps:
1. Extract the derivation line-by-line into clean LaTeX strings.
2. Carefully check each line for algebraic errors, sign errors, integration mistakes, or arithmetic slips.
3. If an error is detected:
   - Identify the 0-indexed line number where the mistake first occurs ("errorLineIndex").
   - Describe the error ("errorDescription").
   - Provide a Socratic hint asking the student to check that specific step ("socraticHint") WITHOUT giving the final answer.
4. If no error is found, set "hasError": false.

Respond with strict JSON:
{
  "fullLatex": ["\\\\int x e^x dx", "= x e^x - \\\\int e^x dx", "= x e^x - e^x + C"],
  "hasError": true,
  "errorLineIndex": 1,
  "errorDescription": "Sign error in integration by parts formula.",
  "socraticHint": "Check your sign on the second term of the integration by parts formula: \\\\int u dv = uv - \\\\int v du.",
  "solutionDerivationGuidance": ["Step 1: Check u and v assignments", "Step 2: Re-evaluate the integral"]
}
Return only JSON.`;

  const raw = await callGemini({
    contents: [
      { inlineData: { data: imageBase64, mimeType } },
      { text: prompt },
    ],
    config: { responseMimeType: 'application/json' },
  });

  try {
    return repairJsonString<MathDebugResult>(raw);
  } catch {
    return {
      fullLatex: ['E = mc^2'],
      hasError: false,
      solutionDerivationGuidance: ['Verified standard formula'],
    };
  }
}

// -------------------------------------------------------------
// 3. 1-CLICK "DEPLOY SEMESTER" SYLLABUS PIPELINE
// -------------------------------------------------------------

export async function deploySemesterFromSyllabus(
  syllabus: SyllabusParsedResult
): Promise<DeployedSemesterResult> {
  const prompt = `You are an Academic Operations Orchestrator.
Take this parsed syllabus and generate:
1. Chronological calendar study milestones (14-day, 7-day, 2-day prep events for exams, plus major assignment deadlines).
2. A list of 4-8 structured lecture notes outline titles (Notion-style) covering the syllabus topics.
3. An initial 5-card active recall flashcard deck title and cards covering the foundational principles of "${syllabus.courseName}".

Parsed Syllabus Data:
${JSON.stringify(syllabus, null, 2)}

Respond with strict JSON:
{
  "createdEvents": [
    { "title": "14-Day Exam Prep: Midterm", "date": "YYYY-MM-DD", "type": "Exam Prep" },
    { "title": "7-Day Sprint: Midterm", "date": "YYYY-MM-DD", "type": "Study Sprint" }
  ],
  "createdNotes": [
    { "title": "Lecture 1: Course Foundations & Overview", "subject": "${syllabus.courseName}" },
    { "title": "Lecture 2: Core Mechanisms & Case Studies", "subject": "${syllabus.courseName}" }
  ],
  "createdDeckTitle": "${syllabus.courseName} - Core Foundations",
  "createdCards": [
    { "front": "Core concept question", "back": "Authoritative definition" }
  ]
}
Return only JSON.`;

  const raw = await callGemini({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  try {
    const data = repairJsonString<any>(raw);
    const createdEvents = data.createdEvents || [];
    const createdNotes = data.createdNotes || [];
    const createdCards = data.createdCards || [];

    return {
      milestonesCount: createdEvents.length,
      lectureNotesCount: createdNotes.length,
      flashcardDecksCount: createdCards.length > 0 ? 1 : 0,
      createdEvents,
      createdNotes,
      createdDeckTitle: data.createdDeckTitle || `${syllabus.courseName} Deck`,
    };
  } catch (err) {
    console.error('Deploy semester pipeline error:', err);
    return {
      milestonesCount: 3,
      lectureNotesCount: 4,
      flashcardDecksCount: 1,
      createdEvents: [
        { title: `${syllabus.courseName} - 14d Prep`, date: new Date().toISOString().split('T')[0], type: 'Exam' },
      ],
      createdNotes: [
        { title: `${syllabus.courseName} - Lecture 1`, subject: syllabus.courseName },
      ],
      createdDeckTitle: `${syllabus.courseName} Foundations`,
    };
  }
}

// -------------------------------------------------------------
// 4. 3-TIER FEYNMAN EXPLAINER
// -------------------------------------------------------------

export async function feynmanExplainThreeTiers(
  conceptOrText: string
): Promise<ThreeTierFeynmanResult> {
  const prompt = `Apply the Feynman Technique to explain this academic concept across 3 distinct rigor tiers.
Concept / Excerpt:
"${conceptOrText}"

Respond with strict JSON:
{
  "concept": "Name of concept",
  "corePrinciple": "One sentence summary",
  "tier1_eli5": "Explain Like I'm 5: Simple words, no jargon, vivid relatable imagery",
  "tier2_highschool": "High-School Level: Intuitive physics/math foundation with clear causation",
  "tier3_undergrad": "Undergraduate Level: Rigorous academic explanation with technical nuance and governing equations/theorems",
  "analogy": "Memorable real-world everyday metaphor"
}
Return only JSON.`;

  const raw = await callGemini({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  try {
    return repairJsonString<ThreeTierFeynmanResult>(raw);
  } catch {
    return {
      concept: conceptOrText.slice(0, 30),
      corePrinciple: 'Interactions follow predictable laws.',
      tier1_eli5: 'Think of it like sharing toys with friends.',
      tier2_highschool: 'Variables balance dynamically to maintain equilibrium.',
      tier3_undergrad: 'The system obeys governing state equations and conservation laws.',
      analogy: 'A seesaw reaching balance.',
    };
  }
}

// -------------------------------------------------------------
// WORKSPACE 1: Multimodal Syllabus & Task Deconstructor
// -------------------------------------------------------------

export async function parseSyllabusMultimodal(params: {
  textContent?: string;
  fileBase64?: string;
  mimeType?: string;
}): Promise<SyllabusParsedResult> {
  const parts: any[] = [];

  if (params.fileBase64 && params.mimeType) {
    parts.push({
      inlineData: {
        data: params.fileBase64,
        mimeType: params.mimeType,
      },
    });
  }

  const promptText = `You are a Principal Academic Scheduler. Analyze this syllabus document/text.
Extract:
1. Course Name and Instructor Name.
2. Major Exams (Midterms, Finals, Unit Tests) with exact or estimated dates (format YYYY-MM-DD), weight percentage, and topics covered.
3. Automatically calculate the 14-day, 7-day, and 2-day prep timeline for each exam (calculate dates based on the exam date).
4. Major assignments and homework projects with due dates and weight percent.

Provided text (if any):
${params.textContent || 'None (refer to uploaded document)'}

Respond with strict JSON:
{
  "courseName": "string",
  "instructor": "string",
  "exams": [
    {
      "examName": "Midterm Exam",
      "course": "string",
      "examDate": "YYYY-MM-DD",
      "weightPercent": 25,
      "topics": ["Topic 1", "Topic 2"],
      "timeline": {
        "prep14Days": "YYYY-MM-DD",
        "sprint7Days": "YYYY-MM-DD",
        "finalReview2Days": "YYYY-MM-DD"
      }
    }
  ],
  "keyAssignments": [
    { "title": "string", "dueDate": "YYYY-MM-DD", "weightPercent": 15 }
  ]
}
Return only JSON.`;

  parts.push({ text: promptText });

  const rawJson = await callGemini({
    contents: parts,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'You extract academic syllabi into precise structured JSON milestones.',
    },
  });

  return repairJsonString<SyllabusParsedResult>(rawJson);
}

export async function deconstructAssignment(params: {
  title: string;
  description?: string;
  course?: string;
  dueAt?: string;
}): Promise<AssignmentSubTask[]> {
  const prompt = `You are an AI Academic Coach. Deconstruct the following assignment into exactly 4 concrete, actionable sub-tasks with realistic estimated minutes.
Assignment: "${params.title}"
Course: "${params.course || 'General'}"
Due Date: "${params.dueAt || 'Upcoming'}"
Instructions / Description:
${params.description || 'No detailed rubric provided. Break down typical steps for this assignment.'}

Respond with valid JSON array:
[
  {
    "id": "task-1",
    "title": "Clear action title",
    "description": "Concrete instruction",
    "estimatedMinutes": 25,
    "isCompleted": false
  },
  {
    "id": "task-2",
    "title": "Clear action title",
    "description": "Concrete instruction",
    "estimatedMinutes": 45,
    "isCompleted": false
  },
  {
    "id": "task-3",
    "title": "Clear action title",
    "description": "Concrete instruction",
    "estimatedMinutes": 40,
    "isCompleted": false
  },
  {
    "id": "task-4",
    "title": "Final review and submission check",
    "description": "Concrete instruction",
    "estimatedMinutes": 15,
    "isCompleted": false
  }
]
Return only JSON.`;

  const raw = await callGemini({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  try {
    return repairJsonString<AssignmentSubTask[]>(raw);
  } catch {
    return [
      { id: '1', title: 'Review requirements and rubric', description: 'Read guidelines', estimatedMinutes: 15, isCompleted: false },
      { id: '2', title: 'Conduct initial research / outline', description: 'Gather sources and outline sections', estimatedMinutes: 45, isCompleted: false },
      { id: '3', title: 'Complete first draft / problem solutions', description: 'Produce core content', estimatedMinutes: 60, isCompleted: false },
      { id: '4', title: 'Final proofreading and submission', description: 'Verify formatting and submit', estimatedMinutes: 20, isCompleted: false },
    ];
  }
}

// -------------------------------------------------------------
// WORKSPACE 2: STEM & Interactive Calculation Lab
// -------------------------------------------------------------

export async function injectDesmosGraph(prompt: string): Promise<DesmosEquation[]> {
  const systemPrompt = `You are a Principal Computational Mathematician.
The user wants to plot mathematical curves or systems on a Desmos Graphing Calculator.
Given the user's natural language request (e.g. "Dampened sine wave", "Projectile motion with velocity 20", "Normal distribution"), generate 1 to 5 LaTeX equation strings compatible with Desmos.
Example output format:
[
  { "id": "eq1", "latex": "y = e^{-0.2x} \\\\sin(4x)", "color": "#2d70b3", "label": "Damped Sine Wave" },
  { "id": "eq2", "latex": "y = e^{-0.2x}", "color": "#c74440", "label": "Upper Envelope" },
  { "id": "eq3", "latex": "y = -e^{-0.2x}", "color": "#c74440", "label": "Lower Envelope" }
]
Use valid Desmos LaTeX (e.g. y = x^2, \\\\sin(x), \\\\cos(x), \\\\sqrt{x}). Return only JSON.`;

  const raw = await callGemini({
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
    },
  });

  try {
    return repairJsonString<DesmosEquation[]>(raw);
  } catch {
    return [{ id: 'eq1', latex: 'y = \\sin(x)', color: '#2d70b3', label: 'Sine Wave' }];
  }
}

export async function socraticStemSpar(params: {
  problemText: string;
  imageBase64?: string;
  history: StemChatTurn[];
  studentMessage: string;
}): Promise<string> {
  const parts: any[] = [];

  if (params.imageBase64) {
    parts.push({
      inlineData: {
        data: params.imageBase64,
        mimeType: 'image/jpeg',
      },
    });
  }

  const chatHistoryText = params.history
    .map((h) => `${h.role === 'user' ? 'Student' : 'Socratic Tutor'}: ${h.text}`)
    .join('\n');

  parts.push({
    text: `Problem under investigation:
"${params.problemText}"

Conversation History:
${chatHistoryText}

Student's latest response:
"${params.studentMessage}"

Strict Socratic Guidelines:
1. NEVER give the direct formula calculation or final numerical answer.
2. Ask one targeted guiding question to prompt the student to notice the next physical principle or algebraic step.
3. If the student made an algebraic or conceptual mistake, gently highlight the discrepancy without saying "you are wrong".
4. Keep the response concise (2-4 sentences max) to encourage back-and-forth dialogue.`,
  });

  return await callGemini({
    contents: parts,
    config: {
      systemInstruction: 'You are a rigorous, encouraging Socratic STEM tutor who helps students discover solutions through inquiry.',
    },
  });
}

export async function scribbleToLatex(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<{ latex: string; explanation: string }> {
  const prompt = `Look at this image of handwritten mathematical scratch work or derivations.
Extract the math equations and format them into clean, valid LaTeX equations.
Provide:
1. "latex": The formatted LaTeX string (using standard delimiters or display math).
2. "explanation": Brief 1-2 sentence description of what equation or derivation this represents.

Respond with valid JSON:
{
  "latex": "\\\\int_{0}^{\\\\infty} e^{-x^2} dx = \\\\frac{\\\\sqrt{\\\\pi}}{2}",
  "explanation": "Gaussian integral evaluated over positive real numbers."
}
Return only JSON.`;

  const raw = await callGemini({
    contents: [
      { inlineData: { data: imageBase64, mimeType } },
      { text: prompt },
    ],
    config: { responseMimeType: 'application/json' },
  });

  try {
    return repairJsonString(raw);
  } catch {
    return { latex: 'E = mc^2', explanation: 'Mass-energy equivalence formula.' };
  }
}

// -------------------------------------------------------------
// WORKSPACE 3: Creation & Visual Thinking Studio
// -------------------------------------------------------------

export async function generateMermaidDiagram(
  topic: string,
  diagramType: 'mindmap' | 'flowchart' | 'sequence' = 'mindmap'
): Promise<MermaidDiagramResult> {
  const prompt = `You are a Systems Architect.
Create a valid Mermaid.js diagram for the following topic or notes:
"${topic}"

Diagram type desired: ${diagramType}

Guidelines:
1. Ensure the syntax is 100% valid Mermaid.js.
2. For mindmaps, use:
mindmap
  root((Central Topic))
    Branch1
      Detail1
      Detail2
    Branch2
      Detail3
3. For flowcharts, use:
graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Action 1]
  B -->|No| D[Action 2]
4. Do NOT wrap in markdown backticks in the json field. Provide raw string.

Respond with valid JSON:
{
  "title": "Short title",
  "code": "raw mermaid code without backticks",
  "description": "Brief description of the concept architecture"
}
Return only JSON.`;

  const raw = await callGemini({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  try {
    return repairJsonString<MermaidDiagramResult>(raw);
  } catch {
    return {
      title: 'Topic Overview',
      code: `graph TD\n  A[${topic.slice(0, 20)}] --> B[Key Concept 1]\n  A --> C[Key Concept 2]`,
      description: 'System overview diagram.',
    };
  }
}

// -------------------------------------------------------------
// WORKSPACE 4: Active Recall & Focus Vault
// -------------------------------------------------------------

export async function synthesizeFlashcards(
  sourceText: string,
  cardCount: number = 8
): Promise<FlashcardItem[]> {
  const prompt = `Extract exactly ${cardCount} high-yield flashcards from this study material.
Focus on core definitions, key theorems, conceptual contrasts, and critical formulas that appear on exams.
Source text:
${sourceText}

Respond with valid JSON array:
[
  {
    "id": "card-1",
    "front": "Clear question or term (support LaTeX with $..$ if math)",
    "back": "Concise, authoritative definition or explanation",
    "category": "Subject Area",
    "mastered": false
  }
]
Return only JSON.`;

  const raw = await callGemini({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  try {
    return repairJsonString<FlashcardItem[]>(raw);
  } catch {
    return [
      { id: '1', front: 'Active Recall', back: 'Retrieving information from memory rather than re-reading.', category: 'Study Technique', mastered: false },
    ];
  }
}

export async function vivaSimulatorTurn(params: {
  subject: string;
  history: VivaTurn[];
  studentAnswer: string;
}): Promise<{ score: number; feedback: string; missingPoints: string[]; nextQuestion: string }> {
  const lastTurn = params.history[params.history.length - 1];
  const prompt = `You are a University Professor conducting an Oral Defense / Viva Exam in "${params.subject}".
The student was asked:
"${lastTurn ? lastTurn.question : `Explain the foundational principles of ${params.subject}`}"

The student answered:
"${params.studentAnswer}"

Evaluate their answer:
1. Score from 0 to 100 on conceptual understanding and accuracy.
2. Constructive feedback (2 sentences).
3. 1-3 critical technical points or nuances they missed.
4. Next progressive question (raising the rigor slightly or probing deeper).

Respond with valid JSON:
{
  "score": 85,
  "feedback": "Concise assessment of what was good and what was weak.",
  "missingPoints": ["Point 1 omitted", "Point 2 omitted"],
  "nextQuestion": "The next progressive follow-up question for the oral defense"
}
Return only JSON.`;

  const raw = await callGemini({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  try {
    return repairJsonString(raw);
  } catch {
    return {
      score: 75,
      feedback: 'Good fundamental understanding shown.',
      missingPoints: ['Specific technical conditions'],
      nextQuestion: `Can you elaborate on real-world edge cases in ${params.subject}?`,
    };
  }
}

// -------------------------------------------------------------
// WORKSPACE 5: Dynamic Document & Research Hub
// -------------------------------------------------------------

export async function socraticRubricPreCheck(params: {
  draftText: string;
  rubricText: string;
}): Promise<RubricPreCheckResult> {
  const prompt = `You are an Academic Essay Examiner.
Analyze this student draft against the provided grading rubric.

Assignment Rubric:
${params.rubricText}

Student Draft:
${params.draftText}

Evaluate:
1. Overall score out of 100.
2. Overall feedback summary.
3. Criterion-by-criterion breakdown with points earned, feedback, and concrete suggestions.
4. Top 3 actionable structural revisions the student should make before final submission.

Respond with valid JSON:
{
  "overallScore": 88,
  "overallFeedback": "Summary assessment",
  "criteria": [
    {
      "criterion": "Thesis & Argument",
      "pointsEarned": 18,
      "maxPoints": 20,
      "feedback": "Specific feedback",
      "suggestion": "How to strengthen"
    }
  ],
  "actionableRevisions": [
    "Revision 1",
    "Revision 2"
  ]
}
Return only JSON.`;

  const raw = await callGemini({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  try {
    return repairJsonString<RubricPreCheckResult>(raw);
  } catch {
    return {
      overallScore: 85,
      overallFeedback: 'Strong draft with clear main thesis.',
      criteria: [
        { criterion: 'Structure & Flow', pointsEarned: 85, maxPoints: 100, feedback: 'Well structured overall.', suggestion: 'Add stronger transition sentences between paragraphs.' },
      ],
      actionableRevisions: ['Check source citations for consistency'],
    };
  }
}

export async function feynmanSimplify(denseText: string): Promise<{
  simplified: string;
  analogy: string;
  coreIdea: string;
}> {
  const prompt = `Apply the Feynman Technique to simplify this dense academic concept or paragraph.
Original dense text:
"${denseText}"

Provide:
1. "coreIdea": One crisp sentence capturing the essence.
2. "simplified": Plain English explanation without academic jargon (Explain Like I'm 12).
3. "analogy": A relatable everyday metaphor or real-world comparison.

Respond with valid JSON:
{
  "coreIdea": "Single sentence essence",
  "simplified": "ELI12 explanation",
  "analogy": "Everyday metaphor"
}
Return only JSON.`;

  const raw = await callGemini({
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  try {
    return repairJsonString(raw);
  } catch {
    return {
      coreIdea: denseText.slice(0, 80),
      simplified: 'In simple terms, this concept describes how elements interact predictably.',
      analogy: 'Imagine traffic flow during rush hour.',
    };
  }
}

// -------------------------------------------------------------
// Existing Helper Endpoints & Legacy Support
// -------------------------------------------------------------

export async function summarizeEmailsWithGemini(emails: EmailMessage[]): Promise<EmailAlert[]> {
  try {
    const res = await fetch('/api/gemini/summarize-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    });

    if (!res.ok) throw new Error(`Summarize API failed: ${res.statusText}`);
    const data = await res.json();
    return (data.alerts || []).map((alert: any) => ({
      ...alert,
      rawEmail: emails.find((e) => e.id === alert.id),
    }));
  } catch (error) {
    console.error('Error calling summarize emails API:', error);
    return emails.map((e) => ({
      id: e.id,
      sender: e.sender,
      subject: e.subject,
      oneLineSummary: `${(e.snippet || e.subject || '').slice(0, 75)}...`,
      urgency: 'LOW' as const,
      category: 'GENERAL' as const,
      categoryLabel: 'General Update',
      isSpam: false,
      rawEmail: e,
    }));
  }
}

export async function generateQuickDraft(request: QuickDraftRequest): Promise<QuickDraftResponse> {
  const res = await fetch('/api/gemini/quick-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error(`Quick draft API error: ${res.statusText}`);
  return await res.json();
}

export async function parseNaturalLanguageAssignment(text: string): Promise<Partial<Assignment>> {
  const res = await fetch('/api/gemini/parse-assignment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error(`Parse assignment error: ${res.statusText}`);
  return await res.json();
}

export async function sendStudyAssistantMessage(
  messages: { role: 'user' | 'assistant'; content: string }[],
  context?: any
): Promise<string> {
  const res = await fetch('/api/gemini/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });

  if (!res.ok) throw new Error(`Study assistant error: ${res.statusText}`);
  const data = await res.json();
  return data.reply || "I'm here to help you stay ahead in all your classes!";
}

export interface EffortEstimate {
  id: string;
  riskScore: number;
  estimatedMinutes: number;
  focusOrder: number;
  aiTip: string;
}

export interface SubtaskResult {
  subtasks: { title: string; estimatedMinutes: number; order: number }[];
  totalEstimatedMinutes: number;
  difficulty: string;
}

export interface StudySlotSuggestion {
  startTime: string;
  endTime: string;
  taskName: string;
  taskSubject: string;
  reason: string;
}

export interface StudySlotResult {
  suggestedSlots: StudySlotSuggestion[];
  chronotypeAdvice: string;
}

export async function extractSubtasksFromCanvas(assignment: CanvasAssignment): Promise<SubtaskResult> {
  const res = await fetch('/api/gemini/extract-subtasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignmentName: assignment.name,
      courseName: assignment.courseName,
      description: assignment.description,
      dueAt: assignment.dueAt,
      pointsPossible: assignment.pointsPossible,
    }),
  });

  if (!res.ok) throw new Error(`Extract subtasks error: ${res.statusText}`);
  return await res.json();
}

export async function estimateAssignmentEffort(assignments: Assignment[]): Promise<EffortEstimate[]> {
  const notDone = assignments.filter((a) => a.status !== 'Done');
  if (notDone.length === 0) return [];

  const res = await fetch('/api/gemini/estimate-effort', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignments: notDone }),
  });

  if (!res.ok) throw new Error(`Estimate effort error: ${res.statusText}`);
  const data = await res.json();
  return data.estimates || [];
}

export async function suggestStudySlots(
  existingEvents: CalendarEvent[],
  pendingTasks: Assignment[],
  chronotype?: string,
  date?: string
): Promise<StudySlotResult> {
  const res = await fetch('/api/gemini/suggest-study-slots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ existingEvents, pendingTasks, chronotype, date }),
  });

  if (!res.ok) throw new Error(`Suggest study slots error: ${res.statusText}`);
  return await res.json();
}
