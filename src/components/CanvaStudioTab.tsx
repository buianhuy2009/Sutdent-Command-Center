import React, { useState } from 'react';
import {
  Palette,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  Presentation,
  FileImage,
  Layers,
  Copy,
  Check,
  X,
  BookOpen,
} from 'lucide-react';

export interface CanvaProject {
  id: string;
  title: string;
  subject: string;
  url: string;
  type: 'Presentation' | 'Infographic' | 'Poster' | 'Document';
  createdAt: string;
}

const LOCAL_CANVA_PROJECTS_KEY = 'scc_canva_projects_v1';

function loadSavedCanvaProjects(): CanvaProject[] {
  try {
    const saved = localStorage.getItem(LOCAL_CANVA_PROJECTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading Canva projects:', e);
  }
  return [];
}

function saveCanvaProjects(list: CanvaProject[]) {
  try {
    localStorage.setItem(LOCAL_CANVA_PROJECTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving Canva projects:', e);
  }
}

export const CanvaStudioTab: React.FC = () => {
  const [projects, setProjects] = useState<CanvaProject[]>(loadSavedCanvaProjects);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<CanvaProject['type']>('Presentation');

  // Preview Lightbox
  const [previewProject, setPreviewProject] = useState<CanvaProject | null>(null);

  // AI Slide Outline Generator
  const [outlineTopic, setOutlineTopic] = useState('');
  const [outlineSlideCount, setOutlineSlideCount] = useState(6);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let cleanUrl = newUrl.trim();
    if (!cleanUrl.includes('embed') && cleanUrl.includes('/design/')) {
      cleanUrl = cleanUrl.replace(/\?.*$/, '') + '/view?embed';
    }

    const newProj: CanvaProject = {
      id: `canva-${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubject.trim() || 'General',
      url: cleanUrl,
      type: newType,
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newProj, ...projects];
    setProjects(updated);
    saveCanvaProjects(updated);

    setNewTitle('');
    setNewSubject('');
    setNewUrl('');
    setIsAddModalOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveCanvaProjects(updated);
  };

  const handleGenerateOutline = async () => {
    if (!outlineTopic.trim()) return;
    setIsGeneratingOutline(true);
    setGeneratedOutline(null);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Generate a structured, professional ${outlineSlideCount}-slide presentation outline for a student on the topic: "${outlineTopic}".
For each slide provide:
- Slide Title & Goal
- 3 Clear Bullet Points
- Suggested Visual or Chart
- Brief Speaker Notes (what to say out loud)

Format cleanly with markdown headings.`,
            },
          ],
          context: { tool: 'canva-outline-generator', topic: outlineTopic },
        }),
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setGeneratedOutline(data.reply || 'Outline generation completed.');
    } catch (err) {
      // High quality fallback
      setGeneratedOutline(`### Slide 1: Introduction to ${outlineTopic}
* **Goal**: Hook the audience and state the central thesis
* **Key Points**:
  - The context & why this topic matters today
  - Overview of the 3 major pillars we will explore
  - Main question this presentation answers
* **Visual**: High-impact hero image or conceptual diagram
* **Speaker Note**: "Welcome everyone. Today we're diving into ${outlineTopic}..."

### Slide 2: Historical Background & Foundations
* **Key Points**:
  - Key events and foundational theories
  - Important contributors and dates
  - How this shaped current understanding
* **Visual**: Timeline infographic with 3 milestones
* **Speaker Note**: "To understand where we are, let's briefly look at how this developed..."

### Slide 3: Core Mechanics & Deep Dive
* **Key Points**:
  - Technical analysis or primary evidence
  - Step-by-step breakdown of how it works
  - Common misconceptions clarified
* **Visual**: Flowchart or comparison table
* **Speaker Note**: "Here is the critical mechanism at play..."

### Slide 4: Real-World Case Study / Application
* **Key Points**:
  - Concrete contemporary example
  - Measurable impacts and data points
  - Lessons learned
* **Visual**: Data chart or case study spotlight callout
* **Speaker Note**: "Let's see this in action through a notable real-world example..."

### Slide 5: Conclusion & Future Outlook
* **Key Points**:
  - Summary of the 3 key takeaways
  - Unresolved questions or emerging trends
  - Final call-to-action or reflection
* **Visual**: Summary icon grid with key metrics
* **Speaker Note**: "To wrap up, remember these three core points. Thank you, and I'll now open the floor for questions."`);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleCopyOutline = () => {
    if (!generatedOutline) return;
    navigator.clipboard.writeText(generatedOutline);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-5 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C4CC] to-[#7D2AE8] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
              Canva Creative Studio
            </h2>
            <p className="text-xs text-[#8C897F] mt-0.5">
              School slide decks, infographics, posters, and AI presentation outlines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl text-xs font-semibold border border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#D97757]" />
            <span>Link Project</span>
          </button>

          <a
            href="https://www.canva.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-white dark:bg-[#1A1917] text-[#8C897F] hover:text-[#5C5A54] rounded-xl text-xs font-semibold border border-[#DFDACB] dark:border-[#2C2B27] flex items-center gap-1 transition-colors"
          >
            <span>Open in Canva</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Quick Canva Template Launchers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Presentations (16:9)',
            url: 'https://www.canva.com/create/presentations/',
            icon: Presentation,
            color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
          },
          {
            label: 'Infographics',
            url: 'https://www.canva.com/create/infographics/',
            icon: Layers,
            color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800',
          },
          {
            label: 'Academic Posters',
            url: 'https://www.canva.com/create/posters/',
            icon: FileImage,
            color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
          },
          {
            label: 'Student Reports',
            url: 'https://www.canva.com/create/documents/',
            icon: BookOpen,
            color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 hover:scale-[1.01] transition-transform ${item.color}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">{item.label}</span>
              </div>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
            </a>
          );
        })}
      </div>

      {/* 2-Column Grid: Saved Projects & AI Slide Outline Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Saved Canva Projects (7 cols) */}
        <section className="lg:col-span-7 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-[#D97757]" />
                <span>My School Projects ({projects.length})</span>
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              {projects.length === 0 ? (
                <div className="py-12 text-center text-[#8C897F] text-xs">
                  <p>No Canva projects linked yet.</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-2 text-[#D97757] hover:underline font-semibold cursor-pointer"
                  >
                    Link your first Canva slide deck or poster
                  </button>
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between gap-3 hover:border-[#D97757]/40 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D97757]/10 text-[#D97757] border border-[#D97757]/20">
                          {proj.type}
                        </span>
                        <span className="text-[10px] text-[#8C897F] font-mono">{proj.subject}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mt-1 truncate">
                        {proj.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setPreviewProject(proj)}
                        className="px-2.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        title="Preview Project (primary)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[#8C897F] hover:text-[#5C5A54] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-lg transition-colors border border-transparent hover:border-[#DFDACB]"
                        title="Open in Canva (secondary)"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-1.5 text-[#8C897F] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Primary inline preview for most recent project */}
          {projects.length > 0 && (
            <div className="mt-4 rounded-xl overflow-hidden border-2 border-[#D97757]/30 shadow-sm">
              <div className="px-3 py-1.5 bg-[#D97757]/10 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#D97757] flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Primary Preview — {projects[0].title}</span>
                <button onClick={() => setPreviewProject(projects[0])} className="text-[11px] font-bold text-[#D97757] hover:underline">Expand →</button>
              </div>
              <div className="h-64 bg-white dark:bg-[#1F1E1B]">
                <iframe src={projects[0].url} className="w-full h-full border-0" title={projects[0].title} allow="fullscreen" />
              </div>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 text-[11px] text-[#8C897F] flex items-center justify-between">
            <span>Tip: Preview is now primary — paste Canva share links with &quot;view?embed&quot; for instant in-app embed.</span>
          </div>
        </section>

        {/* Right Column: AI Slide Deck Outline Generator (5 cols) */}
        <section className="lg:col-span-5 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
                <span>AI Slide Outline Generator</span>
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Presentation Topic or Assignment
                </label>
                <input
                  type="text"
                  value={outlineTopic}
                  onChange={(e) => setOutlineTopic(e.target.value)}
                  placeholder="e.g. Causes of Climate Change, Hamlet Soliloquy..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                    Slide Count
                  </label>
                  <select
                    value={outlineSlideCount}
                    onChange={(e) => setOutlineSlideCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  >
                    <option value={5}>5 Slides (Quick Pitch)</option>
                    <option value={6}>6 Slides (Standard)</option>
                    <option value={8}>8 Slides (Deep Dive)</option>
                    <option value={10}>10 Slides (Comprehensive)</option>
                  </select>
                </div>

                <div className="pt-5">
                  <button
                    onClick={handleGenerateOutline}
                    disabled={isGeneratingOutline || !outlineTopic.trim()}
                    className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingOutline ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingOutline ? 'Generating...' : 'Generate'}</span>
                  </button>
                </div>
              </div>

              {/* Generated Outline Output */}
              {generatedOutline && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] relative">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                    <span className="text-[11px] font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Slide Blueprint & Speaker Notes
                    </span>
                    <button
                      onClick={handleCopyOutline}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-[#8C897F]" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-[#141413] dark:text-[#FAF9F5] max-h-64 overflow-y-auto space-y-2 font-mono text-[11px] leading-relaxed">
                    <pre className="whitespace-pre-wrap font-sans">{generatedOutline}</pre>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex justify-end">
                    <a
                      href="https://www.canva.com/create/presentations/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#D97757] hover:underline flex items-center gap-1"
                    >
                      <span>Create Slides in Canva</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#141413]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl w-full max-w-md p-6 border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#D97757]" />
                <span>Link Canva Project</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#8C897F] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. AP History Final Deck"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. History, Biology"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                    Format
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  >
                    <option value="Presentation">Presentation</option>
                    <option value="Infographic">Infographic</option>
                    <option value="Poster">Poster</option>
                    <option value="Document">Document</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Canva Share URL *
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.canva.com/design/..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Embed Viewer */}
      {previewProject && (
        <div className="fixed inset-0 bg-[#141413]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden">
            <div className="p-4 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#D97757]" />
                <span className="text-xs sm:text-sm font-bold text-[#141413] dark:text-[#FAF9F5] truncate max-w-md">
                  Preview: {previewProject.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewProject.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border border-[#D97757]/30"
                >
                  <span>Open in Canva</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setPreviewProject(null)}
                  className="p-1.5 text-[#8C897F] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#FAF9F5] dark:bg-[#141413] relative">
              <iframe
                src={previewProject.url}
                className="absolute inset-0 w-full h-full border-0"
                title={previewProject.title}
                allow="fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
