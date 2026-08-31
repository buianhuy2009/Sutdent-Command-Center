import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Sparkles,
  HelpCircle,
  BookOpen,
  SlidersHorizontal,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  X,
  User as UserIcon,
  Check,
  Edit2,
  Calendar,
  Timer,
  LayoutGrid,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Assignment, DashboardWidgetId, DashboardLayout, EmailAlert } from '../types';
import { TodayGlanceWidget } from './widgets/TodayGlanceWidget';
import { DeadlinesWidget } from './widgets/DeadlinesWidget';
import { ImportantEmailsWidget } from './widgets/ImportantEmailsWidget';
import { QuickToolsWidget } from './widgets/QuickToolsWidget';
import { QuoteWidget } from './widgets/QuoteWidget';
import { CourseUpdatesWidget } from './widgets/CourseUpdatesWidget';
import { ScratchpadWidget } from './widgets/ScratchpadWidget';

const DEFAULT_WIDGET_ORDER: DashboardWidgetId[] = [
  'today-glance',
  'upcoming-deadlines',
  'important-emails',
  'pinned-tools',
  'course-updates',
  'quote-of-day',
  'scratchpad',
];

const LOCAL_STORAGE_LAYOUT_KEY = 'scc_dashboard_layout_v2';
const LOCAL_STORAGE_NAME_KEY = 'scc_user_preferred_name';
const LOCAL_STORAGE_FOCUS_INTENT_KEY = 'scc_daily_focus_intent';

function loadSavedLayout(): DashboardLayout {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_LAYOUT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.order) && Array.isArray(parsed.hidden)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading dashboard layout:', e);
  }
  return {
    order: DEFAULT_WIDGET_ORDER,
    hidden: [],
  };
}

function saveLayout(layout: DashboardLayout) {
  try {
    localStorage.setItem(LOCAL_STORAGE_LAYOUT_KEY, JSON.stringify(layout));
  } catch (e) {
    console.error('Error saving dashboard layout:', e);
  }
}

interface SortableWidgetProps {
  id: DashboardWidgetId;
  children: React.ReactNode;
  onHide: (id: DashboardWidgetId) => void;
  fullWidth?: boolean;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children, onHide, fullWidth = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${fullWidth ? 'col-span-1 lg:col-span-2' : 'col-span-1'}`}
    >
      {/* Draggable Header Handle overlay */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-xl bg-white/90 dark:bg-[#252422]/90 border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F] hover:text-[#D97757] shadow-2xs cursor-grab active:cursor-grabbing"
          title="Drag to rearrange widget"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onHide(id)}
          className="p-1.5 rounded-xl bg-white/90 dark:bg-[#252422]/90 border border-[#DFDACB] dark:border-[#2C2B27] text-[#8C897F] hover:text-rose-500 shadow-2xs cursor-pointer"
          title="Hide widget from dashboard"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {children}
    </div>
  );
};

interface DashboardHomeProps {
  assignments: Assignment[];
  onToggleAssignment: (id: string) => void;
  onNavigateWorkspace: (tabId: string) => void;
  onOpenQuickDraft?: (emailAlert?: EmailAlert) => void;
  onOpenAiSuite?: (tab?: 'planner' | 'syllabus' | 'quiz' | 'grades') => void;
  onOpenAppStore?: () => void;
  user?: User | null;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  assignments,
  onToggleAssignment,
  onNavigateWorkspace,
  onOpenQuickDraft,
  onOpenAiSuite,
  onOpenAppStore = () => {},
  user,
}) => {
  const [layout, setLayout] = useState<DashboardLayout>(loadSavedLayout);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Personalized Name
  const [customName, setCustomName] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_NAME_KEY) || user?.displayName?.split(' ')[0] || 'Student';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(customName);

  // Focus Intent State
  const [focusIntent, setFocusIntent] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_FOCUS_INTENT_KEY) || 'Deep Work Focus';
  });

  const handleSaveName = () => {
    const trimmed = nameInput.trim() || 'Student';
    setCustomName(trimmed);
    localStorage.setItem(LOCAL_STORAGE_NAME_KEY, trimmed);
    setIsEditingName(false);
  };

  const handleSetFocusIntent = (intent: string) => {
    setFocusIntent(intent);
    localStorage.setItem(LOCAL_STORAGE_FOCUS_INTENT_KEY, intent);
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLayout((prev) => {
        const oldIndex = prev.order.indexOf(active.id as DashboardWidgetId);
        const newIndex = prev.order.indexOf(over.id as DashboardWidgetId);
        const newOrder = arrayMove(prev.order, oldIndex, newIndex);
        const updated = { ...prev, order: newOrder };
        saveLayout(updated);
        return updated;
      });
    }
  };

  const handleHideWidget = (id: DashboardWidgetId) => {
    setLayout((prev) => {
      const updated = {
        ...prev,
        hidden: [...prev.hidden, id],
      };
      saveLayout(updated);
      return updated;
    });
  };

  const handleToggleWidgetVisibility = (id: DashboardWidgetId) => {
    setLayout((prev) => {
      const isHidden = prev.hidden.includes(id);
      const newHidden = isHidden ? prev.hidden.filter((h) => h !== id) : [...prev.hidden, id];
      const updated = { ...prev, hidden: newHidden };
      saveLayout(updated);
      return updated;
    });
  };

  const handleResetLayout = () => {
    const reset = {
      order: DEFAULT_WIDGET_ORDER,
      hidden: [],
    };
    setLayout(reset);
    saveLayout(reset);
    setShowConfigModal(false);
  };

  // Time-aware greeting
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const visibleWidgetIds = layout.order.filter((id) => !layout.hidden.includes(id));

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150 max-w-7xl mx-auto pb-12">
      
      {/* 1. Full-Width Personalized Hero Welcome Section */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Top Header: Greeting, Date, Personalization */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D97757]">
                {todayFormatted}
              </span>
              <span className="text-[#8C897F]">•</span>
              <span className="text-xs text-[#8C897F] font-semibold">
                Personalized Academic Startpage
              </span>
            </div>

            {/* Editable Name Greeting */}
            <div className="flex items-center gap-2.5">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="px-3 py-1 text-lg sm:text-2xl font-extrabold bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#D97757] rounded-xl focus:outline-none text-[#141413] dark:text-[#FAF9F5]"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 bg-[#D97757] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
                    {greetingTime}, {customName}
                  </h1>
                  <button
                    onClick={() => {
                      setNameInput(customName);
                      setIsEditingName(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8C897F] hover:text-[#D97757] transition-opacity cursor-pointer"
                    title="Change preferred name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenAiSuite?.('planner')}
              className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Daily Study Planner</span>
            </button>

            <button
              onClick={() => onOpenAiSuite?.('quiz')}
              className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#D97757]" />
              <span>Practice Exam</span>
            </button>

            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2.5 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] rounded-2xl transition-colors cursor-pointer"
              title="Customize Dashboard Widgets"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Daily Focus Intent Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8C897F]">Today&apos;s Focus Goal:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                'Deep Work Focus',
                'Exam Review Prep',
                'Light Catch-up',
                'Problem Sets & STEM',
              ].map((intent) => (
                <button
                  key={intent}
                  onClick={() => handleSetFocusIntent(intent)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    focusIntent === intent
                      ? 'bg-[#141413] dark:bg-[#FAF9F5] text-white dark:text-[#141413] shadow-xs'
                      : 'bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] text-[#5C5A54] dark:text-[#B5B2A8] hover:border-[#D97757]/60'
                  }`}
                >
                  {intent}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] font-mono text-[#8C897F]">
            Drag widgets via handles to personalize layout
          </span>
        </div>

      </div>

      {/* 2. Drag-and-Drop Sortable Widget Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleWidgetIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleWidgetIds.map((widgetId) => {
              switch (widgetId) {
                case 'today-glance':
                  return (
                    <SortableWidget
                      key="today-glance"
                      id="today-glance"
                      onHide={handleHideWidget}
                      fullWidth={true}
                    >
                      <TodayGlanceWidget
                        assignments={assignments}
                        onNavigate={onNavigateWorkspace}
                        onOpenQuickDraft={onOpenQuickDraft}
                      />
                    </SortableWidget>
                  );

                case 'upcoming-deadlines':
                  return (
                    <SortableWidget
                      key="upcoming-deadlines"
                      id="upcoming-deadlines"
                      onHide={handleHideWidget}
                    >
                      <DeadlinesWidget
                        assignments={assignments}
                        onToggleAssignment={onToggleAssignment}
                        onNavigate={onNavigateWorkspace}
                      />
                    </SortableWidget>
                  );

                case 'important-emails':
                  return (
                    <SortableWidget
                      key="important-emails"
                      id="important-emails"
                      onHide={handleHideWidget}
                    >
                      <ImportantEmailsWidget
                        onNavigate={onNavigateWorkspace}
                        onOpenQuickDraft={onOpenQuickDraft}
                      />
                    </SortableWidget>
                  );

                case 'pinned-tools':
                  return (
                    <SortableWidget
                      key="pinned-tools"
                      id="pinned-tools"
                      onHide={handleHideWidget}
                    >
                      <QuickToolsWidget
                        onNavigate={onNavigateWorkspace}
                        onOpenAppStore={onOpenAppStore}
                      />
                    </SortableWidget>
                  );

                case 'course-updates':
                  return (
                    <SortableWidget
                      key="course-updates"
                      id="course-updates"
                      onHide={handleHideWidget}
                    >
                      <CourseUpdatesWidget onNavigate={onNavigateWorkspace} />
                    </SortableWidget>
                  );

                case 'quote-of-day':
                  return (
                    <SortableWidget
                      key="quote-of-day"
                      id="quote-of-day"
                      onHide={handleHideWidget}
                    >
                      <QuoteWidget />
                    </SortableWidget>
                  );

                case 'scratchpad':
                  return (
                    <SortableWidget
                      key="scratchpad"
                      id="scratchpad"
                      onHide={handleHideWidget}
                    >
                      <ScratchpadWidget onNavigate={onNavigateWorkspace} />
                    </SortableWidget>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* 3. Customize Widgets Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#D97757]" />
                <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                  Customize Home Widgets
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#EFECE2] dark:hover:bg-[#252422] text-[#8C897F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8C897F]">
              Toggle which widgets appear on your personalized start page. You can drag and reorder them anytime on the home screen.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {[
                { id: 'today-glance', label: 'Today at a Glance (Hero Strip)' },
                { id: 'upcoming-deadlines', label: 'Upcoming Coursework Deadlines' },
                { id: 'important-emails', label: 'Important Academic Emails (AI Ranked)' },
                { id: 'pinned-tools', label: 'Quick Tool Shortcuts' },
                { id: 'course-updates', label: 'Followed Course News & Reports' },
                { id: 'quote-of-day', label: 'Quote of the Day' },
                { id: 'scratchpad', label: 'Lecture Scratchpad & Quick Capture' },
              ].map((item) => {
                const isVisible = !layout.hidden.includes(item.id as DashboardWidgetId);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleWidgetVisibility(item.id as DashboardWidgetId)}
                    className="p-3 rounded-2xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between cursor-pointer hover:border-[#D97757] transition-colors"
                  >
                    <span className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                      {item.label}
                    </span>
                    <span
                      className={`p-1.5 rounded-xl ${
                        isVisible
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-stone-100 text-stone-400 dark:bg-stone-800'
                      }`}
                    >
                      {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
              <button
                onClick={handleResetLayout}
                className="px-3.5 py-2 text-xs font-bold text-[#8C897F] hover:text-[#D97757] flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <button
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
