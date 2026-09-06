/**
 * Evidence gallery helper — timestamped snapshots for the Division A dossier.
 * Stores lightweight metadata (no heavy PNG capture by default) so the
 * dossier Section 5 gallery stays offline-friendly.
 */

export interface EvidenceItem {
  id: string;
  timestamp: string;
  feature: string;
  title: string;
  detail: string;
  dataUrl?: string;
}

const KEY = 'scc_evidence_gallery_v1';
const MAX = 100;

export function saveEvidence(feature: string, title: string, detail: string, dataUrl?: string): EvidenceItem {
  const item: EvidenceItem = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    feature,
    title: title.slice(0, 120),
    detail: detail.slice(0, 500),
    dataUrl: dataUrl?.slice(0, 200000),
  };
  try {
    const raw = localStorage.getItem(KEY);
    const arr: EvidenceItem[] = raw ? JSON.parse(raw) : [];
    arr.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)));
  } catch {}
  try { window.dispatchEvent(new CustomEvent('scc:evidence', { detail: { id: item.id } })); } catch {}
  return item;
}

export function getEvidence(): EvidenceItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function clearEvidence(): void {
  try { localStorage.removeItem(KEY); } catch {}
}
