import React from 'react';
import { Calendar, CheckSquare, HardDrive, Inbox, Mail, BookOpen, CreditCard, Sparkles } from 'lucide-react';

export interface EmptyStateAction { label: string; onClick: () => void; primary?: boolean; }

export const EmptyState: React.FC<{
  icon?: any; title: string; description: string;
  actionLabel?: string; onAction?: () => void;
  actions?: EmptyStateAction[];
  illustration?: React.ReactNode;
  tip?: string;
}> = ({ icon: Icon = Inbox, title, description, actionLabel, onAction, actions, illustration, tip }) => {
  const resolved: EmptyStateAction[] = actions ?? (actionLabel && onAction ? [{ label: actionLabel, onClick: onAction, primary: true }] : []);
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 px-6">
      {illustration ?? (
        <div className="w-16 h-16 rounded-2xl surface-token border border-token flex items-center justify-center" style={{ backgroundColor: 'var(--linen)', borderColor: 'var(--line)' }}>
          <Icon className="w-7 h-7 opacity-80" style={{ color: 'var(--terracotta)' }} aria-hidden="true" />
        </div>
      )}
      <h4 className="text-sm font-bold">{title}</h4>
      <p className="text-xs max-w-sm leading-relaxed" style={{ color: 'var(--stone)' }}>{description}</p>
      {resolved.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {resolved.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className={a.primary
                ? 'mt-1 px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs transition-colors min-h-[44px]'
                : 'mt-1 px-4 py-2 rounded-xl text-xs font-bold border transition-colors min-h-[44px]'}
              style={a.primary ? { backgroundColor: 'var(--terracotta)' } : { borderColor: 'var(--line)' }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
      {tip && <p className="text-[11px] max-w-xs leading-relaxed opacity-70">💡 {tip}</p>}
    </div>
  );
};

export const EmptyTodayEvents = (props: { onConnect?: () => void }) => (
  <EmptyState icon={Calendar} title="No events today" description="Your calendar is clear — perfect time for a deep-work block."
    actions={props.onConnect ? [{ label: 'Connect Calendar', onClick: props.onConnect, primary: true }] : [{ label: 'Plan a focus block', onClick: () => {}, primary: true }]}
    tip="Students who time-block 2h daily finish 30% more assignments." />
);

export const EmptyAssignments = (props: { onImportCanvas?: () => void; onParseSyllabus?: () => void; onCreate?: () => void } = {}) => (
  <EmptyState icon={CheckSquare} title="All caught up — nice work" description="No pending assignments. Pull from Canvas, scan a syllabus, or add one by hand."
    actions={[
      ...(props.onImportCanvas ? [{ label: 'Import from Canvas', onClick: props.onImportCanvas, primary: true }] : []),
      ...(props.onParseSyllabus ? [{ label: 'Parse syllabus', onClick: props.onParseSyllabus }] : []),
      ...(props.onCreate ? [{ label: 'Create manually', onClick: props.onCreate }] : []),
    ]}
    tip="Connect Canvas once and deadlines fill in by themselves." />
);

export const EmptyFiles = (props: { onConnect?: () => void } = {}) => (
  <EmptyState icon={HardDrive} title="No recent files" description="Connect Google Drive to see your Docs, Sheets and Slides here."
    actions={props.onConnect ? [{ label: 'Connect Drive', onClick: props.onConnect, primary: true }] : []} />
);

export const EmptyEmails = (props: { onConnect?: () => void } = {}) => (
  <EmptyState icon={Mail} title="Inbox zero — enjoy it" description="No school emails flagged. We scan teacher mail for deadlines automatically."
    actions={props.onConnect ? [{ label: 'Connect Gmail', onClick: props.onConnect, primary: true }] : []} />
);

export const EmptyFlashcards = (props: { onGenerate?: () => void; onImport?: () => void } = {}) => (
  <EmptyState icon={BookOpen} title="No flashcards yet" description="Turn notes or a PDF into a study deck in one click."
    actions={[
      ...(props.onGenerate ? [{ label: 'Generate from notes', onClick: props.onGenerate, primary: true }] : []),
      ...(props.onImport ? [{ label: 'Import Anki .apkg', onClick: props.onImport }] : []),
    ]}
    tip="20 cards a day beats 200 the night before." />
);

export const EmptyScholarships = (props: { onBrowse?: () => void } = {}) => (
  <EmptyState icon={CreditCard} title="No scholarships tracked" description="Add deadlines once — we remind you and reuse your essays."
    actions={props.onBrowse ? [{ label: 'Add your first scholarship', onClick: props.onBrowse, primary: true }] : []} />
);

export const EmptySearch = () => (
  <EmptyState icon={Sparkles} title="No matches" description="Try fewer words, or create it — task, note, or flashcard — right from search (press C)."
    actions={[]} tip="Search covers Canvas, Gmail, Drive, notes and flashcards." />
);
