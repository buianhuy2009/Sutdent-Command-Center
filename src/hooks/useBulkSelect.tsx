import { useState } from 'react';

/** Multi-select with bulk actions: done, move, schedule, delete. Same pattern for Gmail. */
export function useBulkSelect<T extends { id: string }>(items: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(items.map((i) => i.id)));
  const clear = () => setSelected(new Set());
  const selectedItems = items.filter((i) => selected.has(i.id));
  return { selected, selectedItems, count: selected.size, toggle, selectAll, clear, has: (id: string) => selected.has(id) };
}

export function BulkActionBar(props: {
  count: number;
  actions: { label: string; onClick: () => void; danger?: boolean }[];
  onClear: () => void;
}) {
  if (props.count === 0) return null;
  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 p-2 rounded-2xl border shadow-sm no-print" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }} role="toolbar" aria-label={`${props.count} selected`}>
      <span className="text-xs font-bold px-2">{props.count} selected</span>
      {props.actions.map((a, i) => (
        <button key={i} onClick={a.onClick}
          className={`px-3 py-2 text-xs font-bold rounded-xl min-h-[44px] ${a.danger ? 'text-rose-600 border border-rose-300' : 'text-white'}`}
          style={a.danger ? undefined : { backgroundColor: 'var(--terracotta)' }}>
          {a.label}
        </button>
      ))}
      <button onClick={props.onClear} className="ml-auto px-3 py-2 text-xs font-semibold opacity-70 min-h-[44px]">Clear</button>
    </div>
  );
}
