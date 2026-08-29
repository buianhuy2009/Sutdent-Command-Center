import React, { useState, useEffect } from 'react';
import {
  Send,
  X,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Mail,
  ExternalLink,
  Save,
  Globe,
} from 'lucide-react';
import { QuickDraftRequest, QuickDraftResponse, EmailMessage, EmailAlert } from '../types';

interface QuickDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: EmailMessage | null;
  initialAlert?: EmailAlert | null;
  onGenerateDraft: (req: QuickDraftRequest) => Promise<QuickDraftResponse>;
  onSaveToGmailDrafts?: (to: string, subject: string, body: string) => Promise<void>;
  isSavingDraft?: boolean;
}

export const QuickDraftModal: React.FC<QuickDraftModalProps> = ({
  isOpen,
  onClose,
  initialEmail,
  initialAlert,
  onGenerateDraft,
  onSaveToGmailDrafts,
  isSavingDraft = false,
}) => {
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [context, setContext] = useState('');
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  const [intent, setIntent] = useState<'clarification' | 'extension' | 'feedback' | 'meeting' | 'absence'>(
    'clarification'
  );
  const [tone, setTone] = useState<'polite_respectful' | 'formal' | 'brief'>('polite_respectful');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [copied, setCopied] = useState(false);

  // Pre-fill if email or alert provided
  useEffect(() => {
    if (initialAlert) {
      setTeacherName(initialAlert.sender || '');
      setTeacherEmail(initialAlert.rawEmail?.senderEmail || '');
      setSubject(initialAlert.detectedAssignment?.subject || initialAlert.subject || '');
      setContext(initialAlert.oneLineSummary || initialAlert.rawEmail?.snippet || '');
      if (initialAlert.language === 'vi') {
        setLanguage('vi');
      } else {
        setLanguage('en');
      }
      if (initialAlert.category === 'ASSIGNMENT') setIntent('clarification');
    } else if (initialEmail) {
      setTeacherName(initialEmail.sender || '');
      setTeacherEmail(initialEmail.senderEmail || '');
      setSubject(initialEmail.subject || '');
      setContext(initialEmail.snippet || '');
      const isVi = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
        `${initialEmail.subject} ${initialEmail.snippet}`
      );
      if (isVi) setLanguage('vi');
    }
  }, [initialEmail, initialAlert]);

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await onGenerateDraft({
        teacherName: teacherName.trim() || (language === 'vi' ? 'Thầy / Cô' : 'Professor'),
        teacherEmail: teacherEmail.trim(),
        subject: subject.trim() || (language === 'vi' ? 'Môn học' : 'Course Question'),
        context: context.trim(),
        topic: context.trim() || subject.trim(),
        course: subject.trim(),
        intent,
        draftType: intent,
        tone: tone === 'polite_respectful' ? 'Polite & Respectful' : tone === 'formal' ? 'Formal Academic' : 'Brief',
        language,
      });

      setGeneratedSubject(res.subject);
      setGeneratedBody(res.body);
    } catch (err) {
      console.error('Draft generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${generatedSubject}\n\n${generatedBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = async () => {
    if (!onSaveToGmailDrafts) return;
    await onSaveToGmailDrafts(teacherEmail, generatedSubject, generatedBody);
  };

  const intentChips = language === 'vi' ? [
    { id: 'clarification', label: 'Giải đáp thắc mắc bài tập' },
    { id: 'extension', label: 'Xin gia hạn nộp bài (Extension)' },
    { id: 'feedback', label: 'Hỏi về điểm số / Đánh giá' },
    { id: 'meeting', label: 'Hẹn gặp trao đổi (Office Hours)' },
    { id: 'absence', label: 'Xin phép vắng mặt / Đi trễ' },
  ] : [
    { id: 'clarification', label: 'Clarify Assignment Details' },
    { id: 'extension', label: 'Request Extension' },
    { id: 'feedback', label: 'Inquire About Grade / Feedback' },
    { id: 'meeting', label: 'Request Office Hours Meeting' },
    { id: 'absence', label: 'Notify Planned Absence' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      id="quick-draft-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'vi' ? 'Trợ lý Soạn Email Thầy Cô' : 'Teacher Quick Draft Assistant'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'vi'
                  ? 'AI tự động soạn email kính trọng, chuẩn mực lễ nghi học vụ Việt Nam & Quốc tế.'
                  : 'AI generates polite, academic emails with appropriate student etiquette.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switch */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                  language === 'vi'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tiếng Việt
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Intent chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'vi' ? 'Mục đích Email' : 'Email Purpose'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {intentChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setIntent(chip.id as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    intent === chip.id
                      ? 'bg-rose-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'vi' ? 'Tên Thầy / Cô / Giảng viên *' : 'Teacher / Instructor Name *'}
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder={language === 'vi' ? 'vd: Thầy Nguyễn Văn An' : 'e.g. Dr. Martinez'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'vi' ? 'Tên Môn học / Lớp *' : 'Course / Subject *'}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={language === 'vi' ? 'vd: Giải thuật CS201 / Vật lý' : 'e.g. AP Physics C'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'vi' ? 'Chi tiết câu hỏi / Lý do / Ngữ cảnh' : 'Context / Details / Specific Request'}
            </label>
            <textarea
              rows={2}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={
                language === 'vi'
                  ? 'vd: Em xin phép gia hạn Báo cáo Bài tập lớn thêm 2 ngày do máy tính cá nhân bị hỏng phần cứng...'
                  : 'e.g. Asking for clarification on Lab 3 rubric uncertainty propagation or requesting 1-day extension...'
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
            />
          </div>

          {/* Tone Selector & Generate Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">{language === 'vi' ? 'Văn phong:' : 'Tone:'}</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="polite_respectful">{language === 'vi' ? 'Kính trọng, lễ phép' : 'Polite & Respectful'}</option>
                <option value="formal">{language === 'vi' ? 'Trang trọng học vụ' : 'Formal Academic'}</option>
                <option value="brief">{language === 'vi' ? 'Ngắn gọn, súc tích' : 'Direct & Brief'}</option>
              </select>
            </div>

            <button
              type="button"
              id="btn-generate-draft-submit"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !teacherName.trim()}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl shadow-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'vi' ? 'Đang soạn thư với AI...' : 'Drafting with Gemini...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Tạo Bản Thảo Email' : 'Generate Draft'}</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Output */}
          {generatedBody && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-rose-500" />
                  <span>{language === 'vi' ? 'Bản thảo Email Sẵn Sàng' : 'Generated Email Output'}</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'vi' ? 'Có thể chỉnh sửa trực tiếp trước khi gửi' : 'Review & edit before sending'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                  {language === 'vi' ? 'Tiêu đề Email (Subject):' : 'Subject Line:'}
                </label>
                <input
                  type="text"
                  value={generatedSubject}
                  onChange={(e) => setGeneratedSubject(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                  {language === 'vi' ? 'Nội dung Email (Body):' : 'Body:'}
                </label>
                <textarea
                  rows={7}
                  value={generatedBody}
                  onChange={(e) => setGeneratedBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white leading-relaxed font-sans"
                />
              </div>

              {/* Action buttons on generated draft */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'vi' ? 'Đã sao chép!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Sao chép toàn bộ' : 'Copy All'}</span>
                    </>
                  )}
                </button>

                {onSaveToGmailDrafts && (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingDraft ? 'Saving Draft...' : (language === 'vi' ? 'Lưu vào Gmail Drafts' : 'Save to Gmail Drafts')}</span>
                  </button>
                )}

                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                    teacherEmail
                  )}&su=${encodeURIComponent(generatedSubject)}&body=${encodeURIComponent(
                    generatedBody
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>{language === 'vi' ? 'Mở trong Gmail Web' : 'Open in Gmail Web'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
