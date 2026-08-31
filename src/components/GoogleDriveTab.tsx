import React, { useState, useMemo } from 'react';
import {
  HardDrive,
  FileText,
  ExternalLink,
  RefreshCw,
  Search,
  Layers,
  X,
  FileSpreadsheet,
  Presentation,
  File,
  Share2,
  Users,
  Check,
  Sparkles,
} from 'lucide-react';
import { SchoolFile, ApiEnablementInfo } from '../types';
import { ApiActivationBanner } from './ApiActivationBanner';
import { shareGoogleDriveFile } from '../services/googleWorkspace';

interface GoogleDriveTabProps {
  recentFiles: SchoolFile[];
  isLoadingFiles: boolean;
  onRefreshFiles: () => void;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  driveError?: string | null;
  driveApiInfo?: ApiEnablementInfo | null;
  googleToken?: string;
}

export const GoogleDriveTab: React.FC<GoogleDriveTabProps> = ({
  recentFiles,
  isLoadingFiles,
  onRefreshFiles,
  isGoogleConnected = true,
  onConnectGoogle,
  driveError,
  driveApiInfo,
  googleToken,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fileCategory, setFileCategory] = useState<string>('ALL');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Sharing state
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const getFileTypeDetails = (mimeType: string) => {
    if (mimeType.includes('document') || mimeType.includes('docx')) {
      return { label: 'Google Doc', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) {
      return { label: 'Google Sheet', icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    }
    if (mimeType.includes('presentation') || mimeType.includes('slide')) {
      return { label: 'Google Slide', icon: Presentation, color: 'text-amber-500', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    }
    if (mimeType.includes('pdf')) {
      return { label: 'PDF Document', icon: File, color: 'text-rose-500', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
    }
    return { label: 'School File', icon: File, color: 'text-slate-500', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
  };

  const filteredFiles = useMemo(() => {
    return recentFiles.filter((file) => {
      if (fileCategory === 'DOCS' && !file.mimeType.includes('document') && !file.mimeType.includes('docx')) return false;
      if (fileCategory === 'SHEETS' && !file.mimeType.includes('spreadsheet') && !file.mimeType.includes('sheet')) return false;
      if (fileCategory === 'SLIDES' && !file.mimeType.includes('presentation') && !file.mimeType.includes('slide')) return false;
      if (fileCategory === 'PDF' && !file.mimeType.includes('pdf')) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!file.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [recentFiles, fileCategory, searchQuery]);

  const activeFile = useMemo(() => {
    if (selectedFileId) {
      const found = filteredFiles.find((f) => f.id === selectedFileId);
      if (found) return found;
    }
    return filteredFiles[0] || null;
  }, [selectedFileId, filteredFiles]);

  const handleShareFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFile || !shareEmail.trim() || !googleToken) return;
    setIsSharing(true);
    setShareSuccess(false);
    try {
      await shareGoogleDriveFile(googleToken, activeFile.id);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 4000);
    } catch (err) {
      console.error('Error sharing file:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Files' },
            { id: 'DOCS', label: 'Docs' },
            { id: 'SHEETS', label: 'Sheets' },
            { id: 'SLIDES', label: 'Slides' },
            { id: 'PDF', label: 'PDFs' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFileCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                fileCategory === cat.id
                  ? 'bg-[#D97757] text-white shadow-xs'
                  : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border border-[#DFDACB] dark:border-[#2C2B27]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right Search & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#8C897F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
            />
          </div>

          <button
            onClick={onRefreshFiles}
            disabled={isLoadingFiles}
            className="p-1.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] rounded-xl transition-colors cursor-pointer"
            title="Refresh Files"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin text-[#D97757]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {driveApiInfo ? (
        <ApiActivationBanner info={driveApiInfo} onRetry={onRefreshFiles} isRetrying={isLoadingFiles} />
      ) : driveError ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <span>{driveError}</span>
          {onConnectGoogle && (
            <button onClick={onConnectGoogle} className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-semibold cursor-pointer">
              Connect Drive
            </button>
          )}
        </div>
      ) : null}

      {/* TWO-PANE MASTER-DETAIL LAYOUT */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] overflow-hidden shadow-xs flex flex-col md:flex-row h-[600px]">
        
        {/* LEFT MASTER PANE: Compact File List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-[#DFDACB] dark:border-[#2C2B27] flex flex-col bg-[#FAF9F5] dark:bg-[#1F1E1B] overflow-hidden">
          <div className="p-3 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between text-xs font-bold text-[#8C897F]">
            <span>Drive Items</span>
            <span>{filteredFiles.length} Files</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#DFDACB]/40 dark:divide-[#2C2B27]/40">
            {isLoadingFiles ? (
              <div className="p-12 text-center text-[#8C897F] flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#D97757]" />
                <span className="text-xs">Indexing Google Drive files...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-12 text-center text-[#8C897F] text-xs">
                No files found in Google Drive.
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = activeFile?.id === file.id;
                const fileType = getFileTypeDetails(file.mimeType);
                const Icon = fileType.icon;

                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`p-3.5 hover:bg-white dark:hover:bg-[#141413] transition-colors cursor-pointer text-left flex items-start gap-3 ${
                      isSelected ? 'bg-white dark:bg-[#141413] font-semibold border-l-3 border-[#D97757]' : ''
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${fileType.color}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-[#141413] dark:text-[#FAF9F5] font-semibold truncate mb-0.5">
                        {file.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#8C897F]">
                        <span className={`px-1.5 py-0.2 rounded font-bold ${fileType.bg}`}>
                          {fileType.label}
                        </span>
                        {file.modifiedTime && (
                          <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT DETAIL PANE: File Inspector & Sharing Studio */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#141413] overflow-hidden">
          {activeFile ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Header */}
              <div className="p-6 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-start justify-between gap-4 bg-[#FAF9F5]/40 dark:bg-[#1F1E1B]/40">
                <div className="min-w-0 space-y-1">
                  <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5] leading-snug">
                    {activeFile.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#8C897F]">
                    <span>Type: <strong className="text-[#141413] dark:text-[#FAF9F5]">{getFileTypeDetails(activeFile.mimeType).label}</strong></span>
                    {activeFile.modifiedTime && (
                      <>
                        <span>•</span>
                        <span>Modified: {new Date(activeFile.modifiedTime).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>

                {activeFile.webViewLink && (
                  <a
                    href={activeFile.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                
                {/* 1-Click Peer Sharing Card */}
                <div className="p-5 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-3">
                  <div className="flex items-center gap-2 font-bold text-[#141413] dark:text-[#FAF9F5]">
                    <Share2 className="w-4 h-4 text-[#D97757]" />
                    <span>1-Click Peer &amp; Instructor Sharing</span>
                  </div>
                  <p className="text-[11px] text-[#8C897F]">
                    Grant instant reader/commenter permissions to a study group member or professor.
                  </p>

                  <form onSubmit={handleShareFile} className="flex gap-2">
                    <input
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="colleague@university.edu..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#D97757]"
                    />
                    <button
                      type="submit"
                      disabled={isSharing || !shareEmail.trim()}
                      className="px-4 py-2 bg-[#141413] dark:bg-[#FAF9F5] text-white dark:text-[#141413] rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSharing ? 'Sharing...' : 'Share'}
                    </button>
                  </form>

                  {shareSuccess && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>Successfully shared file permissions!</span>
                    </div>
                  )}
                </div>

                {/* File Details */}
                <div className="p-4 bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C897F] block">
                    File Identifiers
                  </span>
                  <div className="space-y-1 text-[#8C897F] text-[11px] font-mono">
                    <div>ID: {activeFile.id}</div>
                    <div>MIME: {activeFile.mimeType}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#8C897F] text-center space-y-2">
              <HardDrive className="w-10 h-10 opacity-30" />
              <p className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">Select a file to inspect</p>
              <p className="text-[11px] max-w-xs">View file details, share with peers, or open in Google Drive.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
