import React, { useState, useMemo } from 'react';
import {
  HardDrive,
  FileText,
  ExternalLink,
  RefreshCw,
  Search,
  Layers,
  X,
  AlertTriangle,
  FileSpreadsheet,
  Presentation,
  File,
  Eye,
  Share2,
  Users,
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
  // Lightbox Modal state
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; id?: string } | null>(null);
  const [fileCategory, setFileCategory] = useState<'ALL' | 'DOCS' | 'SHEETS' | 'SLIDES' | 'PDF'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sharingFileId, setSharingFileId] = useState<string | null>(null);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const getFileTypeDetails = (mimeType: string) => {
    if (mimeType.includes('document') || mimeType.includes('docx')) {
      return {
        label: 'Google Doc',
        icon: FileText,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      };
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) {
      return {
        label: 'Google Sheet',
        icon: FileSpreadsheet,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      };
    }
    if (mimeType.includes('presentation') || mimeType.includes('slide')) {
      return {
        label: 'Google Slide',
        icon: Presentation,
        color: 'text-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    }
    if (mimeType.includes('pdf')) {
      return {
        label: 'PDF Document',
        icon: File,
        color: 'text-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      };
    }
    return {
      label: 'School File',
      icon: File,
      color: 'text-slate-500',
      bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    };
  };

  const filteredFiles = useMemo(() => {
    return recentFiles.filter((file) => {
      // Category filter
      if (fileCategory === 'DOCS' && !file.mimeType.includes('document') && !file.mimeType.includes('docx')) {
        return false;
      }
      if (fileCategory === 'SHEETS' && !file.mimeType.includes('spreadsheet') && !file.mimeType.includes('sheet')) {
        return false;
      }
      if (fileCategory === 'SLIDES' && !file.mimeType.includes('presentation') && !file.mimeType.includes('slide')) {
        return false;
      }
      if (fileCategory === 'PDF' && !file.mimeType.includes('pdf')) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        return file.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }

      return true;
    });
  }, [recentFiles, fileCategory, searchQuery]);

  const handleShareFile = async (fileId: string) => {
    if (!googleToken) {
      alert('Please connect your Google account to auto-share.');
      return;
    }
    setSharingFileId(fileId);
    try {
      await shareGoogleDriveFile(googleToken, fileId);
      alert('Successfully shared! Link access granted.');
    } catch (err: any) {
      alert('Sharing failed: ' + (err?.message || err));
    } finally {
      setSharingFileId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-5 border border-[#DFDACB] dark:border-[#2C2B27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D97757]/10 dark:bg-[#D97757]/20 text-[#D97757] flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#FAF9F5] tracking-tight">
              Google Drive Files
            </h2>
            <p className="text-xs text-[#8C897F] mt-0.5">
              {recentFiles.length} recent school documents & materials in Drive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefreshFiles}
            disabled={isLoadingFiles}
            className="p-2 text-[#5C5A54] hover:text-[#141413] dark:text-[#B5B2A8] dark:hover:text-[#FAF9F5] bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-xl border border-[#DFDACB] dark:border-[#2C2B27] transition-colors cursor-pointer"
            title="Refresh Google Drive files"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin text-[#D97757]' : ''}`} />
          </button>

          {!isGoogleConnected && onConnectGoogle && (
            <button
              onClick={onConnectGoogle}
              className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Connect Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* API Activation Banner or Error */}
      {driveApiInfo ? (
        <ApiActivationBanner info={driveApiInfo} onRetry={onRefreshFiles} isRetrying={isLoadingFiles} />
      ) : driveError ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{driveError}</span>
          </div>
          {onConnectGoogle && (
            <button
              onClick={onConnectGoogle}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 cursor-pointer text-xs"
            >
              Reconnect Drive
            </button>
          )}
        </div>
      ) : null}

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#8C897F] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] placeholder:text-[#8C897F]"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {(['ALL', 'DOCS', 'SHEETS', 'SLIDES', 'PDF'] as const).map((cat) => {
            const isActive = fileCategory === cat;
            const labelMap = {
              ALL: 'All Files',
              DOCS: 'Docs',
              SHEETS: 'Sheets',
              SLIDES: 'Slides',
              PDF: 'PDFs',
            };
            return (
              <button
                key={cat}
                onClick={() => setFileCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-[#D97757] text-white border-[#D97757] shadow-2xs'
                    : 'bg-[#FAF9F5] dark:bg-[#252422] text-[#5C5A54] dark:text-[#B5B2A8] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] border-[#DFDACB] dark:border-[#2C2B27]'
                }`}
              >
                {labelMap[cat]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Files Grid */}
      <section className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
          <h3 className="font-bold text-[#141413] dark:text-[#FAF9F5] text-xs uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#D97757]" />
            <span>Files ({filteredFiles.length})</span>
          </h3>
        </div>

        <div className="mt-4">
          {isLoadingFiles && recentFiles.length === 0 ? (
            <div className="py-12 text-center text-[#8C897F] text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#D97757] mb-2" />
              <span>Scanning your Google Drive files...</span>
            </div>
          ) : !isGoogleConnected ? (
            <div className="py-12 px-4 text-center bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-xl border border-dashed border-[#DFDACB] dark:border-[#2C2B27]">
              <HardDrive className="w-10 h-10 mx-auto text-[#D97757] mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">Connect Google Drive</h4>
              <p className="text-xs text-[#8C897F] mt-1 max-w-sm mx-auto">
                Sign in with Google to view and preview your coursework, assignments, and slides directly in your command center.
              </p>
              {onConnectGoogle && (
                <button
                  onClick={onConnectGoogle}
                  className="mt-3.5 px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Connect Drive Account
                </button>
              )}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-12 text-center text-[#8C897F] text-xs">
              <p>No files found matching your search or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredFiles.map((file) => {
                const typeDetails = getFileTypeDetails(file.mimeType);
                const IconComponent = typeDetails.icon;

                return (
                  <div
                    key={file.id}
                    className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/50 transition-all flex flex-col justify-between gap-3 group shadow-2xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeDetails.bg}`}
                        >
                          <IconComponent className="w-3 h-3 shrink-0" />
                          <span>{typeDetails.label}</span>
                        </span>
                        <span className="text-[10px] text-[#8C897F] font-mono shrink-0">
                          {formatRelativeTime(file.modifiedTime)}
                        </span>
                      </div>

                      <h4
                        className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] mt-2.5 line-clamp-2 group-hover:text-[#D97757] transition-colors leading-snug"
                        title={file.name}
                      >
                        {file.name}
                      </h4>
                    </div>

                    <div className="pt-2.5 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8C897F]">
                        {file.sharedWithMe && (
                          <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400" title="Shared with you">
                            <Users className="w-3 h-3" />
                            <span>Shared</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewFile({ name: file.name, url: file.webViewLink, id: file.id })}
                          className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#2C2B27] rounded-lg transition-colors cursor-pointer"
                          title="Preview in Lightbox"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-[#5C5A54] dark:text-[#B5B2A8] hover:text-[#D97757] hover:bg-[#EFECE2] dark:hover:bg-[#2C2B27] rounded-lg transition-colors"
                          title="Open in Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Lightbox Doc Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-[#141413]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-[#DFDACB] dark:border-[#2C2B27] animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Lightbox Header */}
            <div className="p-4 border-b border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#D97757] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-[#141413] dark:text-[#FAF9F5] truncate max-w-[200px] sm:max-w-md">
                  Preview: {previewFile.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {previewFile.id && (
                  <button
                    onClick={() => handleShareFile(previewFile.id!)}
                    disabled={sharingFileId === previewFile.id}
                    className="px-2.5 py-1.5 bg-[#FAF9F5] dark:bg-[#252422] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] text-[#141413] dark:text-[#FAF9F5] rounded-xl text-xs font-semibold flex items-center gap-1 border border-[#DFDACB] dark:border-[#2C2B27] transition-colors cursor-pointer"
                    title="Auto-Share file link access"
                  >
                    <Share2 className="w-3 h-3 text-[#D97757]" />
                    <span>{sharingFileId === previewFile.id ? 'Sharing...' : 'Auto-Share'}</span>
                  </button>
                )}

                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border border-[#D97757]/30"
                >
                  <span>Open Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 text-[#8C897F] hover:bg-[#EFECE2] dark:hover:bg-[#2C2A26] rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded IFrame */}
            <div className="flex-1 bg-[#FAF9F5] dark:bg-[#141413] relative">
              <iframe
                src={previewFile.url.replace('/edit', '/preview')}
                className="absolute inset-0 w-full h-full border-0"
                title={previewFile.name}
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
