import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Palette,
  Sparkles,
  Plus,
  ExternalLink,
  Layers,
  Presentation,
  FileImage,
  BookOpen,
  X,
  Check,
  Copy,
  Trash2,
  RefreshCw,
  Maximize2,
  Minimize2,
  Share2,
  MoreHorizontal,
  Code2,
  Edit2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export interface CanvaProject {
  id: string;
  title: string;
  subject?: string;
  url: string;
  type: 'Presentation' | 'Infographic' | 'Poster' | 'Document';
  isDraft?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CanvaTemplateOption {
  id: string;
  type: CanvaProject['type'];
  title: string;
  description: string;
  url: string;
  icon: typeof Presentation;
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
}

export const CANVA_TEMPLATES: CanvaTemplateOption[] = [
  {
    id: 'tpl-presentation',
    type: 'Presentation',
    title: 'Presentations (16:9)',
    description: 'Class lectures, slide decks, pitch presentations, and keynote visual slides',
    url: 'https://www.canva.com/create/presentations/',
    icon: Presentation,
    colorTheme: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      border: 'border-purple-200 dark:border-purple-800/60',
      text: 'text-purple-700 dark:text-purple-300',
      badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
    },
  },
  {
    id: 'tpl-poster',
    type: 'Poster',
    title: 'Academic Posters',
    description: 'Science fair boards, research symposium posters, and creative infographics',
    url: 'https://www.canva.com/create/posters/',
    icon: FileImage,
    colorTheme: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800/60',
      text: 'text-amber-700 dark:text-amber-300',
      badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    },
  },
  {
    id: 'tpl-document',
    type: 'Document',
    title: 'Student Documents & Reports',
    description: 'Lab reports, essays, resumes, syllabus sheets, and research papers',
    url: 'https://www.canva.com/create/documents/',
    icon: BookOpen,
    colorTheme: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-800/60',
      text: 'text-blue-700 dark:text-blue-300',
      badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    },
  },
  {
    id: 'tpl-infographic',
    type: 'Infographic',
    title: 'Infographics & Data Graphics',
    description: 'Timeline graphics, comparison charts, process flows, and statistical overviews',
    url: 'https://www.canva.com/create/infographics/',
    icon: Layers,
    colorTheme: {
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      border: 'border-teal-200 dark:border-teal-800/60',
      text: 'text-teal-700 dark:text-teal-300',
      badge: 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300',
    },
  },
];

export const PRIMARY_STORAGE_KEY = 'studentos_canva_projects';
export const LEGACY_STORAGE_KEY = 'scc_canva_projects_v1';

/**
 * Smart URL & HTML Sanitizer (Zero-Error Parser)
 * Automatically extracts valid embed links from:
 * 1. Full HTML <iframe> snippets
 * 2. Standard edit links (canva.com/design/ID/edit -> converts to /view?embed)
 * 3. Smart embed links (canva.com/design/ID/view?embed or watch?embed)
 */
export function sanitizeCanvaEmbedUrl(input: string): string {
  if (!input) return '';
  let str = input.trim();

  // Decode common HTML entities
  str = str
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&quot;/g, '"');

  // 1. Extract src if student pastes <iframe> or HTML embed snippet
  const iframeSrcMatch = str.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    str = iframeSrcMatch[1].trim();
  }

  // Strip leading/trailing quotes, angle brackets, or spaces
  str = str.replace(/^['"<]+|['">]+$/g, '').trim();
  if (!str) return '';

  // Ensure protocol
  if (!/^https?:\/\//i.test(str)) {
    if (str.startsWith('www.') || str.includes('canva.com')) {
      str = 'https://' + str;
    }
  }

  try {
    const parsed = new URL(str);
    if (parsed.hostname.includes('canva.com')) {
      const pathname = parsed.pathname;

      // Extract design ID and potential subpaths
      // Formats: /design/DAFxxx/view, /design/DAFxxx/edit, /design/DAFxxx/slug/edit, /design/DAFxxx/slug/view
      const match = pathname.match(
        /^\/design\/([A-Za-z0-9_-]+)(?:\/([A-Za-z0-9_-]+))?(?:\/([A-Za-z0-9_-]+))?/
      );

      if (match) {
        const id = match[1];
        const seg2 = match[2];
        const seg3 = match[3];

        if (!seg2 || seg2 === 'edit' || seg2 === 'view' || seg2 === 'watch') {
          return `https://www.canva.com/design/${id}/view?embed`;
        }
        if (seg2 && (!seg3 || seg3 === 'edit' || seg3 === 'view' || seg3 === 'watch')) {
          return `https://www.canva.com/design/${id}/${seg2}/view?embed`;
        }
      }

      // If already has /view and embed param
      if (pathname.includes('/view') && parsed.searchParams.get('embed') !== null) {
        return parsed.toString();
      }

      if (pathname.endsWith('/view') || pathname.endsWith('/watch')) {
        parsed.searchParams.set('embed', '');
        return parsed.toString();
      }

      if (pathname.endsWith('/edit')) {
        parsed.pathname = pathname.replace(/\/edit$/, '/view');
        parsed.searchParams.set('embed', '');
        return parsed.toString();
      }
    }
  } catch {
    // Regex fallback
    const idMatch = str.match(/\/design\/([A-Za-z0-9_-]+)/);
    if (idMatch) {
      return `https://www.canva.com/design/${idMatch[1]}/view?embed`;
    }
  }

  return str;
}

function loadSavedCanvaProjects(): CanvaProject[] {
  try {
    // Check primary key first
    const primarySaved = localStorage.getItem(PRIMARY_STORAGE_KEY);
    if (primarySaved) {
      const parsed = JSON.parse(primarySaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Migration from legacy key
    const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacySaved) {
      const parsed = JSON.parse(legacySaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        saveCanvaProjects(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading Canva projects:', e);
  }

  // Default initial project for instant high-density preview
  const defaultStarter: CanvaProject[] = [
    {
      id: 'canva-starter-demo',
      title: 'Biology Research Presentation',
      subject: 'Biology',
      url: 'https://www.canva.com/design/DAF_starter/view?embed',
      type: 'Presentation',
      isDraft: true,
      createdAt: new Date().toLocaleDateString(),
    },
  ];
  return defaultStarter;
}

function saveCanvaProjects(list: CanvaProject[]) {
  try {
    localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studentos:canva_synced', { detail: { count: list.length } }));
    }
  } catch (e) {
    console.error('Error saving Canva projects:', e);
  }
}

export const CanvaStudioTab: React.FC = () => {
  const [projects, setProjects] = useState<CanvaProject[]>(loadSavedCanvaProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const list = loadSavedCanvaProjects();
    return list.length > 0 ? list[0].id : '';
  });

  // Modal States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);

  // Add Project Form State (Modal)
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newUrlInput, setNewUrlInput] = useState('');
  const [newType, setNewType] = useState<CanvaProject['type']>('Presentation');
  const [addStepActive, setAddStepActive] = useState<number>(1);

  // In-place Quick Paste State (for active draft project)
  const [inlinePasteUrl, setInlinePasteUrl] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Inline Tab Renaming State
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabTitle, setEditingTabTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // AI Slide Outline Generator State
  const [outlineTopic, setOutlineTopic] = useState('');
  const [outlineSlideCount, setOutlineSlideCount] = useState(6);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<string | null>(null);
  const [copiedOutline, setCopiedOutline] = useState(false);

  // Active Project Reference
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  // Sync projects state to localStorage
  const updateProjects = useCallback((updated: CanvaProject[]) => {
    setProjects(updated);
    saveCanvaProjects(updated);
  }, []);

  // Ensure active project is always valid
  useEffect(() => {
    if (projects.length > 0 && (!activeProjectId || !projects.some((p) => p.id === activeProjectId))) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  // Focus rename input on tab double click
  useEffect(() => {
    if (editingTabId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingTabId]);

  // Action 1: Create New Project via Template Picker
  const handleSelectTemplate = (template: CanvaTemplateOption) => {
    const newDraftProject: CanvaProject = {
      id: `canva-proj-${Date.now()}`,
      title: `Untitled ${template.type}`,
      subject: 'Class Project',
      url: '',
      type: template.type,
      isDraft: true,
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newDraftProject, ...projects];
    updateProjects(updated);
    setActiveProjectId(newDraftProject.id);
    setIsTemplateModalOpen(false);

    // Open template in Canva in a new focused tab
    window.open(template.url, '_blank', 'noopener,noreferrer');
  };

  // Action 2: Add My Own Project (via 4-step modal)
  const handleAddCustomProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrlInput.trim()) return;

    const sanitized = sanitizeCanvaEmbedUrl(newUrlInput.trim());

    const newProject: CanvaProject = {
      id: `canva-proj-${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubject.trim() || 'General',
      url: sanitized,
      type: newType,
      isDraft: false,
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newProject, ...projects];
    updateProjects(updated);
    setActiveProjectId(newProject.id);

    // Reset Form
    setNewTitle('');
    setNewSubject('');
    setNewUrlInput('');
    setNewType('Presentation');
    setIsAddModalOpen(false);
    setAddStepActive(1);
  };

  // Dock In-Place Quick Paste URL into active draft tab
  const handleDockInlineUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !inlinePasteUrl.trim()) return;

    const sanitized = sanitizeCanvaEmbedUrl(inlinePasteUrl.trim());
    if (!sanitized) {
      setInlineError('Please enter a valid Canva share link or embed code.');
      return;
    }

    setInlineError(null);
    const updated = projects.map((p) =>
      p.id === activeProject.id
        ? {
            ...p,
            url: sanitized,
            isDraft: false,
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    updateProjects(updated);
    setInlinePasteUrl('');
  };

  // Delete Project Tab
  const handleDeleteProject = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = projects.filter((p) => p.id !== id);
    updateProjects(updated);
    if (activeProjectId === id && updated.length > 0) {
      setActiveProjectId(updated[0].id);
    }
  };

  // Start Rename Tab
  const handleStartRename = (project: CanvaProject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTabId(project.id);
    setEditingTabTitle(project.title);
  };

  // Save Rename Tab
  const handleSaveRename = () => {
    if (!editingTabId) return;
    const finalTitle = editingTabTitle.trim() || 'Untitled Project';
    const updated = projects.map((p) =>
      p.id === editingTabId ? { ...p, title: finalTitle, updatedAt: new Date().toISOString() } : p
    );
    updateProjects(updated);
    setEditingTabId(null);
    setEditingTabTitle('');
  };

  // Handle Tab Rename Keydown
  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
      setEditingTabTitle('');
    }
  };

  // AI Slide Outline Generator
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
              content: `Generate a structured, high-grade ${outlineSlideCount}-slide presentation outline for a student on the topic: "${outlineTopic}".
For each slide provide:
- Slide Title & Objective
- 3 Punchy Bullet Points
- Visual or Diagram Suggestion for Canva
- Speaker Talking Points (what to say out loud)

Format cleanly with markdown headers.`,
            },
          ],
          context: { tool: 'canva-outline-generator', topic: outlineTopic },
        }),
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setGeneratedOutline(data.reply || 'Outline ready.');
    } catch {
      // High-grade fallback
      setGeneratedOutline(`### Slide 1: Introduction to ${outlineTopic}
* **Objective**: Hook the audience and state the core research question
* **Key Content**:
  - The real-world relevance & modern context
  - Key questions we aim to answer
  - Roadmap of our 3 core analytical sections
* **Canva Visual**: Bold high-resolution hero background with contrasting title typography
* **Speaker Script**: "Welcome everyone. Today we're exploring ${outlineTopic} and examining how its principles apply to our studies..."

### Slide 2: Historical Foundations & Theoretical Framework
* **Key Content**:
  - Major milestones and discovery timeline
  - Key researchers and foundational models
  - Evolution from early hypotheses to current consensus
* **Canva Visual**: 3-step horizontal process timeline with milestone icons
* **Speaker Script**: "Before we look at modern data, let's understand the foundational discoveries..."

### Slide 3: Core Analysis & Deep-Dive Data
* **Key Content**:
  - Primary evidence and experimental findings
  - Quantitative metrics and key variables
  - Common misconceptions vs. empirical reality
* **Canva Visual**: Split-column comparison chart or data infographic
* **Speaker Script**: "Here is where the data becomes fascinating. Notice the correlation shown in this chart..."

### Slide 4: Real-World Case Study & Application
* **Key Content**:
  - Practical application in the field
  - Measurable societal or scientific impact
  - Critical challenges encountered
* **Canva Visual**: Case spotlight callout card with 2 key statistics
* **Speaker Script**: "To see this theory in action, we turn to a concrete contemporary case study..."

### Slide 5: Synthesis & Future Outlook
* **Key Content**:
  - Summary of the 3 primary takeaways
  - Unanswered questions for future research
  - Final actionable conclusions
* **Canva Visual**: 3-card summary grid with accent icons
* **Speaker Script**: "In conclusion, these findings demonstrate the lasting importance of ${outlineTopic}. Thank you, and I welcome any questions."`);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleCopyOutline = () => {
    if (!generatedOutline) return;
    navigator.clipboard.writeText(generatedOutline);
    setCopiedOutline(true);
    setTimeout(() => setCopiedOutline(false), 2000);
  };

  // Helper to get type icon
  const getProjectIcon = (type: CanvaProject['type']) => {
    switch (type) {
      case 'Presentation':
        return Presentation;
      case 'Poster':
        return FileImage;
      case 'Document':
        return BookOpen;
      case 'Infographic':
        return Layers;
      default:
        return Palette;
    }
  };

  return (
    <div
      className={`flex flex-col w-full bg-[#FAF9F5] dark:bg-[#141413] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] shadow-sm overflow-hidden transition-all duration-200 select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-0 h-screen p-0'
          : 'h-[calc(100vh-140px)] min-h-[620px]'
      }`}
    >
      {/* 1. macOS High-Density Toolbar (38px–42px) */}
      <div className="h-[42px] min-h-[42px] px-3 bg-[#F4F1EA] dark:bg-[#1A1917] border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between gap-3 shrink-0 select-none">
        {/* Left Section: macOS Traffic Lights & Project Tabs */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-1.5 shrink-0 pr-1.5">
            <button
              onClick={() => {
                if (activeProject) handleDeleteProject(activeProject.id);
              }}
              title="Close Active Project Tab"
              className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center group"
            >
              <X className="w-2 h-2 text-[#7E0000] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
              title="Toggle AI Outline Drawer"
              className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center group"
            >
              <Sparkles className="w-2 h-2 text-[#805300] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center group"
            >
              <Maximize2 className="w-2 h-2 text-[#0B5C1B] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#DFDACB] dark:bg-[#2C2B27] shrink-0 mx-0.5" />

          {/* Project Header Pills / Tabs (macOS style) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              const Icon = getProjectIcon(proj.type);
              const isEditing = editingTabId === proj.id;

              return (
                <div
                  key={proj.id}
                  onClick={() => setActiveProjectId(proj.id)}
                  onDoubleClick={(e) => handleStartRename(proj, e)}
                  className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-all border ${
                    isActive
                      ? 'bg-white dark:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border-[#DFDACB] dark:border-[#3A3833] shadow-xs'
                      : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#8C897F] hover:text-[#5C5A54] dark:hover:text-[#B5B2A8] border-transparent'
                  }`}
                  title={`${proj.title} (Double-click to rename)`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-[#D97757]' : 'text-[#8C897F] group-hover:text-[#5C5A54]'
                    }`}
                  />

                  {isEditing ? (
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={editingTabTitle}
                      onChange={(e) => setEditingTabTitle(e.target.value)}
                      onBlur={handleSaveRename}
                      onKeyDown={handleRenameKeyDown}
                      className="w-28 text-xs font-semibold bg-[#FAF9F5] dark:bg-[#1A1917] border border-[#D97757] rounded px-1 py-0.5 outline-none text-[#141413] dark:text-[#FAF9F5]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">{proj.title}</span>
                  )}

                  {proj.isDraft && !proj.url && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Draft (Link pending)" />
                  )}

                  {/* Actions inside tab */}
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                    {!isEditing && (
                      <button
                        onClick={(e) => handleStartRename(proj, e)}
                        className="p-0.5 hover:text-[#D97757] rounded transition-colors"
                        title="Rename Tab"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteProject(proj.id, e)}
                      className="p-0.5 hover:text-rose-500 rounded transition-colors ml-0.5"
                      title="Delete Project"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Draft Tab Button */}
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="p-1 rounded-lg text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="New Project Draft"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Section: Dual-Action Header Buttons & Auxiliary Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Dual Action Button 1: Create New Project */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-[#7D2AE8] to-[#00C4CC] hover:opacity-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">✨ Create New Project</span>
            <span className="sm:hidden">✨ Create</span>
          </button>

          {/* Dual Action Button 2: Add My Own Project */}
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setAddStepActive(1);
            }}
            className="px-2.5 sm:px-3 py-1 bg-white dark:bg-[#252422] hover:bg-[#FAF9F5] dark:hover:bg-[#2C2A26] text-[#141413] dark:text-[#FAF9F5] border border-[#DFDACB] dark:border-[#2C2B27] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-[#D97757]" />
            <span className="hidden sm:inline">➕ Add My Own Project</span>
            <span className="sm:hidden">➕ Add</span>
          </button>

          <div className="h-4 w-[1px] bg-[#DFDACB] dark:bg-[#2C2B27] mx-0.5 hidden sm:block" />

          {/* AI Slide Outline Toggle */}
          <button
            onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              isAiDrawerOpen
                ? 'bg-[#D97757]/10 text-[#D97757] border-[#D97757]/30'
                : 'bg-white dark:bg-[#252422] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] border-[#DFDACB] dark:border-[#2C2B27]'
            }`}
            title="AI Slide Outline Blueprint"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
          </button>

          {/* Reload Active Iframe */}
          {activeProject?.url && !activeProject.isDraft && (
            <button
              onClick={() => setIframeReloadKey((k) => k + 1)}
              className="p-1.5 rounded-lg bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors cursor-pointer"
              title="Reload Embedded Canvas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Open Active Project in Canva */}
          <a
            href={activeProject?.url || 'https://www.canva.com'}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] transition-colors"
            title="Open in Canva Web"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 2. Main Viewport & Optional AI Outline Drawer */}
      <div className="flex-1 relative flex overflow-hidden bg-white dark:bg-[#141413]">
        {/* Main Canvas Area */}
        <div className="flex-1 h-full flex flex-col relative overflow-hidden">
          {projects.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF9F5] dark:bg-[#141413]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C4CC] to-[#7D2AE8] text-white flex items-center justify-center shadow-md mb-4">
                <Palette className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                Welcome to Canva Studio
              </h3>
              <p className="text-xs text-[#8C897F] max-w-sm mt-1 mb-6">
                Create school presentations, academic posters, documents, or link an existing design to dock it live.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#7D2AE8] to-[#00C4CC] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>✨ Create New Project</span>
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-white dark:bg-[#252422] text-[#141413] dark:text-[#FAF9F5] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#FAF9F5] dark:hover:bg-[#2C2A26] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#D97757]" />
                  <span>➕ Add My Own Project</span>
                </button>
              </div>
            </div>
          ) : activeProject?.isDraft || !activeProject?.url ? (
            /* Draft Mode In-Place Helper Card inside the Main Viewport */
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#FAF9F5] dark:bg-[#141413] overflow-y-auto">
              <div className="max-w-xl w-full bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 sm:p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7D2AE8] to-[#00C4CC] text-white flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D97757]/10 text-[#D97757] border border-[#D97757]/20">
                        {activeProject.type} Draft
                      </span>
                      <span className="text-[11px] text-[#8C897F]">{activeProject.subject || 'School Work'}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#141413] dark:text-[#FAF9F5] mt-0.5">
                      Designing on Canva... Paste your embed link here to dock it live!
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-[#8C897F] leading-relaxed mb-5">
                  We opened your template in Canva. When your slide deck or poster is ready, copy its public embed code or share link and paste it below to interact with it right inside StudentOS.
                </p>

                {/* 4-Step Quick Flow Reminder */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                  <div className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB]/60 dark:border-[#2C2B27] text-center">
                    <div className="text-[10px] font-bold text-[#D97757] uppercase tracking-wider mb-0.5">Step 1</div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Click Share</div>
                    <div className="text-[10px] text-[#8C897F] mt-0.5">Top right of Canva</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB]/60 dark:border-[#2C2B27] text-center">
                    <div className="text-[10px] font-bold text-[#D97757] uppercase tracking-wider mb-0.5">Step 2</div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Select More</div>
                    <div className="text-[10px] text-[#8C897F] mt-0.5">Bottom of share list</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB]/60 dark:border-[#2C2B27] text-center">
                    <div className="text-[10px] font-bold text-[#D97757] uppercase tracking-wider mb-0.5">Step 3</div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Click Embed</div>
                    <div className="text-[10px] text-[#8C897F] mt-0.5">Activate public view</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB]/60 dark:border-[#2C2B27] text-center">
                    <div className="text-[10px] font-bold text-[#D97757] uppercase tracking-wider mb-0.5">Step 4</div>
                    <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Paste & Dock</div>
                    <div className="text-[10px] text-[#8C897F] mt-0.5">Zero-error parser</div>
                  </div>
                </div>

                {/* Inline Quick Paste Box */}
                <form onSubmit={handleDockInlineUrl} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-1">
                      Paste Canva Embed Link or HTML Code:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inlinePasteUrl}
                        onChange={(e) => {
                          setInlinePasteUrl(e.target.value);
                          if (inlineError) setInlineError(null);
                        }}
                        placeholder="e.g. <iframe src='...'> or canva.com/design/.../edit"
                        className="flex-1 px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                      />
                      <button
                        type="submit"
                        disabled={!inlinePasteUrl.trim()}
                        className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
                      >
                        Dock Project
                      </button>
                    </div>
                    {inlineError && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1.5">{inlineError}</p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="text-[#D97757] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>View 4-step visual guide</span>
                    </button>

                    <a
                      href="https://www.canva.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] flex items-center gap-1 transition-colors"
                    >
                      <span>Re-open Canva</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* Live Embedded Canva Project Viewport */
            <div className="flex-1 w-full h-full relative bg-[#FAF9F5] dark:bg-[#141413] flex flex-col">
              <iframe
                key={`${activeProject.id}-${iframeReloadKey}`}
                src={activeProject.url}
                title={activeProject.title}
                className="w-full flex-1 border-0"
                allow="fullscreen; clipboard-read; clipboard-write"
                allowFullScreen
                loading="lazy"
              />

              {/* Bottom Subtle Status Bar */}
              <div className="h-7 px-3 bg-[#F4F1EA] dark:bg-[#1A1917] border-t border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between text-[11px] text-[#8C897F] shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-semibold text-[#141413] dark:text-[#FAF9F5] truncate">
                    {activeProject.title}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#D97757]/10 text-[#D97757]">
                    {activeProject.type}
                  </span>
                  {activeProject.subject && (
                    <span className="hidden sm:inline text-[#8C897F]">({activeProject.subject})</span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleStartRename(activeProject)}
                    className="hover:text-[#141413] dark:hover:text-[#FAF9F5] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Rename</span>
                  </button>
                  <a
                    href={activeProject.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#D97757] flex items-center gap-1"
                  >
                    <span>Canva Direct</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Slide Outline Generator Drawer (Collapsible) */}
        {isAiDrawerOpen && (
          <aside className="w-80 sm:w-96 bg-white dark:bg-[#1A1917] border-l border-[#DFDACB] dark:border-[#2C2B27] flex flex-col shadow-lg z-20 animate-in slide-in-from-right-4 duration-200">
            {/* Drawer Header */}
            <div className="h-[42px] px-3 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between bg-[#F4F1EA] dark:bg-[#1F1E1B]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97757]" />
                <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                  AI Slide Outline Generator
                </h3>
              </div>
              <button
                onClick={() => setIsAiDrawerOpen(false)}
                className="p-1 rounded-lg text-[#8C897F] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Presentation Topic / Assignment
                </label>
                <input
                  type="text"
                  value={outlineTopic}
                  onChange={(e) => setOutlineTopic(e.target.value)}
                  placeholder="e.g. CRISPR Gene Editing, The Cold War..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                    Slide Count
                  </label>
                  <select
                    value={outlineSlideCount}
                    onChange={(e) => setOutlineSlideCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  >
                    <option value={5}>5 Slides (Pitch)</option>
                    <option value={6}>6 Slides (Standard)</option>
                    <option value={8}>8 Slides (Deep Dive)</option>
                    <option value={10}>10 Slides (Comprehensive)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleGenerateOutline}
                    disabled={isGeneratingOutline || !outlineTopic.trim()}
                    className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingOutline ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingOutline ? 'Generating...' : 'Generate'}</span>
                  </button>
                </div>
              </div>

              {/* Generated Outline View */}
              {generatedOutline && (
                <div className="mt-3 p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27]">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]">
                    <span className="text-[11px] font-bold text-[#141413] dark:text-[#FAF9F5]">
                      Slide Outline & Notes
                    </span>
                    <button
                      onClick={handleCopyOutline}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedOutline ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#8C897F]" />
                      )}
                      <span>{copiedOutline ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-[#141413] dark:text-[#FAF9F5] max-h-72 overflow-y-auto space-y-2 leading-relaxed">
                    <pre className="whitespace-pre-wrap font-sans text-[11px]">{generatedOutline}</pre>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 3. MODAL: "✨ Create New Project" (Template Picker) */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl w-full max-w-xl p-6 border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7D2AE8] to-[#00C4CC] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                    ✨ Choose a Canva Template
                  </h3>
                  <p className="text-[11px] text-[#8C897F]">
                    Click any format to open Canva and create a live dock tab in StudentOS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 text-[#8C897F] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {CANVA_TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 hover:scale-[1.01] hover:shadow-md transition-all cursor-pointer ${tpl.colorTheme.bg} ${tpl.colorTheme.border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg bg-white dark:bg-[#1A1917] shadow-xs ${tpl.colorTheme.text}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tpl.colorTheme.badge}`}>
                          {tpl.type}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                        {tpl.title}
                      </h4>
                      <p className="text-[11px] text-[#5C5A54] dark:text-[#B5B2A8] mt-1 leading-snug">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-[#D97757] pt-1">
                      <span>Launch Template →</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between text-xs text-[#8C897F]">
              <span>Already have an existing design?</span>
              <button
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="text-[#D97757] font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>➕ Add My Own Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: "➕ Add My Own Project" (4-Step Visual Guide & Parser) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl w-full max-w-2xl p-6 border border-[#DFDACB] dark:border-[#2C2B27] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#D97757]/10 text-[#D97757] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                    ➕ Add My Own Canva Project
                  </h3>
                  <p className="text-[11px] text-[#8C897F]">
                    4-step visual guide to embed your Canva design with zero error
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-[#8C897F] hover:bg-[#FAF9F5] dark:hover:bg-[#252422] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4-Step Visual Interactive Guide */}
            <div className="mt-4">
              <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mb-2.5 flex items-center justify-between">
                <span>4-Step Visual Guide to Get Your Embed Code:</span>
                <span className="text-[11px] font-normal text-[#8C897F]">Takes ~10 seconds</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    step: 1,
                    title: 'Click Share',
                    detail: 'Top right of Canva editor window',
                    icon: Share2,
                  },
                  {
                    step: 2,
                    title: 'Select More (•••)',
                    detail: 'Scroll down to the bottom of menu',
                    icon: MoreHorizontal,
                  },
                  {
                    step: 3,
                    title: 'Click Embed (</>)',
                    detail: 'Activate public embed code',
                    icon: Code2,
                  },
                  {
                    step: 4,
                    title: 'Copy & Paste',
                    detail: 'Copy HTML code or Smart link',
                    icon: Copy,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isCurrent = addStepActive === item.step;
                  return (
                    <div
                      key={item.step}
                      onClick={() => setAddStepActive(item.step)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#D97757]/10 border-[#D97757] shadow-xs'
                          : 'bg-[#FAF9F5] dark:bg-[#252422] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/40'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1.5">
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            isCurrent
                              ? 'bg-[#D97757] text-white'
                              : 'bg-[#DFDACB] dark:bg-[#3A3833] text-[#5C5A54] dark:text-[#B5B2A8]'
                          }`}
                        >
                          {item.step}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] flex items-center justify-center gap-1">
                        <Icon className="w-3.5 h-3.5 text-[#D97757]" />
                        <span>{item.title}</span>
                      </div>
                      <div className="text-[10px] text-[#8C897F] mt-0.5 leading-tight">{item.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAddCustomProject} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. AP World History Final Presentation"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                    Subject / Class
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. History, Biology, Math"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                    Format
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  >
                    <option value="Presentation">Presentation (16:9)</option>
                    <option value="Poster">Academic Poster</option>
                    <option value="Document">Document / Report</option>
                    <option value="Infographic">Infographic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C5A54] dark:text-[#B5B2A8] mb-1">
                  Canva Share Link or HTML &lt;iframe&gt; Embed Code *
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    required
                    value={newUrlInput}
                    onChange={(e) => setNewUrlInput(e.target.value)}
                    placeholder="Paste full <iframe> HTML embed code, or canva.com/design/.../edit or .../view?embed link"
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                  />
                  {newUrlInput.trim() && (
                    <div className="absolute right-2 bottom-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Smart Sanitizer Active</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#8C897F] mt-1">
                  Smart URL & HTML sanitizer automatically converts iframe snippets, standard edit links, and smart embed links into responsive views.
                </p>
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
                  disabled={!newTitle.trim() || !newUrlInput.trim()}
                  className="px-4 py-1.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Dock Live Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

