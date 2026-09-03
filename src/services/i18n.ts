import { useState } from 'react';

export type Lang = 'en' | 'vi';

const STRINGS: Record<string, { en: string; vi: string }> = {
  dashboard: { en: 'Dashboard', vi: 'Bảng điều khiển' },
  assignments: { en: 'Assignments', vi: 'Bài tập' },
  due_today: { en: 'Due today', vi: 'Hạn hôm nay' },
  overdue: { en: 'Overdue', vi: 'Quá hạn' },
  upcoming: { en: 'Upcoming', vi: 'Sắp tới' },
  inbox_zero: { en: 'Inbox zero — enjoy it', vi: 'Hộp thư trống — tuyệt vời' },
  connect_google: { en: 'Connect Google', vi: 'Kết nối Google' },
  search_placeholder: { en: 'Search assignments, emails, files, notes…', vi: 'Tìm bài tập, email, tệp, ghi chú…' },
  exam: { en: 'Exam', vi: 'Kỳ thi' },
  grade: { en: 'Grade', vi: 'Điểm' },
  schedule: { en: 'Schedule', vi: 'Lịch học' },
  all_caught_up: { en: 'All caught up — nice work', vi: 'Xong hết rồi — giỏi lắm' },
  focus: { en: 'Focus', vi: 'Tập trung' },
  settings: { en: 'Settings', vi: 'Cài đặt' },
};

let current: Lang = ((): Lang => {
  try { return (localStorage.getItem('scc_lang_v1') as Lang) || 'en'; } catch { return 'en'; }
})();

const listeners = new Set<(l: Lang) => void>();

export function getLang(): Lang { return current; }
export function setLang(l: Lang) {
  current = l;
  try { localStorage.setItem('scc_lang_v1', l); } catch {}
  try { document.documentElement.lang = l; } catch {}
  listeners.forEach((fn) => fn(l));
}

export function t(key: string): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[current] ?? entry.en;
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setL] = useState<Lang>(current);
  useState(() => {
    const fn = (l: Lang) => setL(l);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  });
  return [lang, (l) => setLang(l)];
}

export const LANG_OPTIONS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'vi', label: 'Tiếng Việt' },
];
