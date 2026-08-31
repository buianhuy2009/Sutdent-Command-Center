import React, { useState, useEffect } from 'react';
import {
  Github,
  GitBranch,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Star,
  GitFork,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Folder,
  FileCode,
  ArrowLeft,
  Key,
  Check,
  Clock,
  User as UserIcon,
} from 'lucide-react';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  default_branch: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: {
    avatar_url: string;
    login: string;
  } | null;
  html_url: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  comments: number;
  labels: Array<{ id: number; name: string; color: string }>;
  pull_request?: any;
}

interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  download_url: string | null;
  html_url: string;
}

const LOCAL_SAVED_REPOS_KEY = 'scc_github_saved_repos_v2';
const LOCAL_GITHUB_PAT_KEY = 'scc_github_pat_v1';

const DEFAULT_REPOS = [
  'facebook/react',
  'buianhuy2009/Sutdent-Command-Center',
  'tailwindlabs/tailwindcss',
  'vercel/next.js',
];

export const GitHubWorkspace: React.FC = () => {
  const [savedRepoNames, setSavedRepoNames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SAVED_REPOS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_REPOS;
  });

  const [patToken, setPatToken] = useState<string>(() => {
    try {
      return localStorage.getItem(LOCAL_GITHUB_PAT_KEY) || '';
    } catch {
      return '';
    }
  });

  const [selectedRepoName, setSelectedRepoName] = useState<string>(savedRepoNames[0] || 'facebook/react');
  const [activeTab, setActiveTab] = useState<'overview' | 'commits' | 'issues' | 'files'>('overview');
  
  // Loaded Data
  const [repoDetails, setRepoDetails] = useState<GitHubRepo | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [files, setFiles] = useState<GitHubContentItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFileContent, setSelectedFileContent] = useState<{ name: string; content: string } | null>(null);
  
  // Loading and Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newRepoInput, setNewRepoInput] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  // Headers for GitHub API (includes PAT if present for high rate limit)
  const getHeaders = () => {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (patToken.trim()) {
      headers.Authorization = `token ${patToken.trim()}`;
    }
    return headers;
  };

  const fetchRepoData = async (repoName: string) => {
    if (!repoName.includes('/')) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedFileContent(null);
    setCurrentPath('');

    try {
      const headers = getHeaders();
      
      // 1. Fetch Repository Details
      const repoRes = await fetch(`https://api.github.com/repos/${repoName}`, { headers });
      if (!repoRes.ok) {
        if (repoRes.status === 404) {
          throw new Error(`Repository "${repoName}" not found. Ensure it is public or provide a Personal Access Token.`);
        } else if (repoRes.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Add a GitHub Personal Access Token in Settings for 5,000 req/hr.');
        } else {
          throw new Error(`GitHub API Error (${repoRes.status})`);
        }
      }
      const repoData: GitHubRepo = await repoRes.json();
      setRepoDetails(repoData);

      // 2. Fetch Recent Commits
      const commitsRes = await fetch(`https://api.github.com/repos/${repoName}/commits?per_page=15`, { headers });
      if (commitsRes.ok) {
        const commitsData: GitHubCommit[] = await commitsRes.json();
        setCommits(commitsData);
      }

      // 3. Fetch Issues & Pull Requests
      const issuesRes = await fetch(`https://api.github.com/repos/${repoName}/issues?state=open&per_page=15`, { headers });
      if (issuesRes.ok) {
        const issuesData: GitHubIssue[] = await issuesRes.json();
        setIssues(issuesData);
      }

      // 4. Fetch Root Contents
      const contentsRes = await fetch(`https://api.github.com/repos/${repoName}/contents`, { headers });
      if (contentsRes.ok) {
        const contentsData: GitHubContentItem[] = await contentsRes.json();
        if (Array.isArray(contentsData)) {
          setFiles(contentsData);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch repository data from GitHub.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolderContents = async (path: string) => {
    if (!selectedRepoName) return;
    setIsLoading(true);
    try {
      const headers = getHeaders();
      const res = await fetch(`https://api.github.com/repos/${selectedRepoName}/contents/${path}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFiles(data);
          setCurrentPath(path);
          setSelectedFileContent(null);
        }
      }
    } catch (err) {
      console.error('Error fetching folder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFileRaw = async (item: GitHubContentItem) => {
    if (!item.download_url) return;
    setIsLoading(true);
    try {
      const res = await fetch(item.download_url);
      if (res.ok) {
        const text = await res.text();
        setSelectedFileContent({ name: item.name, content: text });
      }
    } catch (err) {
      console.error('Error fetching file content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRepoName) {
      fetchRepoData(selectedRepoName);
    }
  }, [selectedRepoName]);

  const handleAddRepo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newRepoInput.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    if (!cleanName || !cleanName.includes('/')) return;

    if (!savedRepoNames.includes(cleanName)) {
      const updated = [cleanName, ...savedRepoNames];
      setSavedRepoNames(updated);
      try {
        localStorage.setItem(LOCAL_SAVED_REPOS_KEY, JSON.stringify(updated));
      } catch {}
    }
    setSelectedRepoName(cleanName);
    setNewRepoInput('');
  };

  const handleRemoveRepo = (repoName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRepoNames.filter((r) => r !== repoName);
    setSavedRepoNames(updated);
    try {
      localStorage.setItem(LOCAL_SAVED_REPOS_KEY, JSON.stringify(updated));
    } catch {}
    if (selectedRepoName === repoName && updated.length > 0) {
      setSelectedRepoName(updated[0]);
    }
  };

  const handleSavePat = () => {
    try {
      localStorage.setItem(LOCAL_GITHUB_PAT_KEY, patToken.trim());
      setTokenSaved(true);
      setTimeout(() => {
        setTokenSaved(false);
        setShowTokenModal(false);
        if (selectedRepoName) fetchRepoData(selectedRepoName);
      }, 1000);
    } catch {}
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* 1. Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#24292e] text-white flex items-center justify-center shadow-md shadow-black/20">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                GitHub Code &amp; Project Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Live GitHub REST API
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Live commit histories, pull requests, issues, and file browser for any GitHub repository
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTokenModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Configure GitHub Personal Access Token"
          >
            <Key className="w-3.5 h-3.5 text-[#D97757]" />
            <span>{patToken ? 'PAT Configured' : 'Add GitHub PAT'}</span>
          </button>

          <button
            onClick={() => fetchRepoData(selectedRepoName)}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#5C5A54] dark:text-[#B5B2A8] transition-colors cursor-pointer"
            title="Refresh Repository"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {repoDetails && (
            <a
              href={repoDetails.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-[#24292e] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* 2. Repository Switcher & Quick Add */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Saved Repositories List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F] block">
              Tracked Repositories
            </span>

            {/* Add Repo Form */}
            <form onSubmit={handleAddRepo} className="flex gap-2">
              <input
                type="text"
                value={newRepoInput}
                onChange={(e) => setNewRepoInput(e.target.value)}
                placeholder="owner/repo (e.g. facebook/react)"
                className="flex-1 px-3 py-1.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Track</span>
              </button>
            </form>

            {/* Repo Chips */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {savedRepoNames.map((r) => {
                const isSelected = selectedRepoName === r;
                return (
                  <div
                    key={r}
                    onClick={() => setSelectedRepoName(r)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#FAF9F5] dark:bg-[#252422] border-[#D97757] text-[#141413] dark:text-[#FAF9F5] font-bold shadow-xs'
                        : 'bg-white dark:bg-[#1A1917] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/60 text-[#5C5A54] dark:text-[#B5B2A8]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Github className="w-4 h-4 text-[#8C897F] shrink-0" />
                      <span className="text-xs truncate">{r}</span>
                    </div>
                    <button
                      onClick={(e) => handleRemoveRepo(r, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity cursor-pointer"
                      title="Untrack Repository"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Active Repository Overview & Live Data */}
        <div className="lg:col-span-8 space-y-4">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {repoDetails ? (
            <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-6">
              {/* Repository Title & Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60">
                <div className="flex items-center gap-3.5">
                  <img
                    src={repoDetails.owner.avatar_url}
                    alt={repoDetails.owner.login}
                    className="w-10 h-10 rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27]"
                  />
                  <div>
                    <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                      {repoDetails.full_name}
                    </h3>
                    <p className="text-xs text-[#8C897F] line-clamp-1">
                      {repoDetails.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-[#5C5A54] dark:text-[#B5B2A8]">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {repoDetails.stargazers_count.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5" />
                    {repoDetails.forks_count.toLocaleString()}
                  </span>
                  {repoDetails.language && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-bold">
                      {repoDetails.language}
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="flex items-center gap-2 border-b border-[#DFDACB]/60 dark:border-[#2C2B27]/60 pb-2">
                {[
                  { id: 'overview', label: 'Overview', icon: GitBranch },
                  { id: 'commits', label: `Commits (${commits.length})`, icon: GitCommit },
                  { id: 'issues', label: `Issues & PRs (${issues.length})`, icon: GitPullRequest },
                  { id: 'files', label: 'File Tree', icon: Folder },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === t.id
                        ? 'bg-[#D97757] text-white shadow-xs'
                        : 'text-[#8C897F] hover:text-[#141413] dark:hover:text-[#FAF9F5] hover:bg-[#FAF9F5] dark:hover:bg-[#252422]'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27]">
                      <span className="text-[10px] uppercase font-bold text-[#8C897F] block">Default Branch</span>
                      <span className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] font-mono mt-1 block">
                        {repoDetails.default_branch}
                      </span>
                    </div>
                    <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27]">
                      <span className="text-[10px] uppercase font-bold text-[#8C897F] block">Open Issues &amp; PRs</span>
                      <span className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] mt-1 block">
                        {repoDetails.open_issues_count}
                      </span>
                    </div>
                    <div className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27]">
                      <span className="text-[10px] uppercase font-bold text-[#8C897F] block">Last Synced to GitHub</span>
                      <span className="text-xs font-semibold text-[#141413] dark:text-[#FAF9F5] mt-1 block">
                        {new Date(repoDetails.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Latest 3 Commits Preview */}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F] block mb-2">
                      Recent Activity
                    </span>
                    <div className="divide-y divide-[#DFDACB]/60 dark:divide-[#2C2B27]/60">
                      {commits.slice(0, 3).map((c) => (
                        <div key={c.sha} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <GitCommit className="w-4 h-4 text-[#D97757] shrink-0" />
                            <span className="font-mono text-[#D97757] text-[11px] font-bold">
                              {c.sha.slice(0, 7)}
                            </span>
                            <span className="truncate text-[#141413] dark:text-[#FAF9F5]">
                              {c.commit.message.split('\n')[0]}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8C897F] whitespace-nowrap">
                            {new Date(c.commit.author.date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COMMITS */}
              {activeTab === 'commits' && (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {commits.map((c) => (
                    <a
                      key={c.sha}
                      href={c.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] hover:border-[#D97757] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start justify-between gap-3 transition-colors block group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {c.author?.avatar_url ? (
                          <img src={c.author.avatar_url} alt="" className="w-6 h-6 rounded-full mt-0.5" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#DFDACB] flex items-center justify-center text-[10px]">
                            <UserIcon className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] group-hover:text-[#D97757] transition-colors leading-tight">
                            {c.commit.message.split('\n')[0]}
                          </div>
                          <div className="text-[11px] text-[#8C897F] mt-1 flex items-center gap-2">
                            <span>{c.commit.author.name}</span>
                            <span>•</span>
                            <span className="font-mono text-[#D97757]">{c.sha.slice(0, 7)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#8C897F] whitespace-nowrap">
                        {new Date(c.commit.author.date).toLocaleDateString()}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {/* TAB 3: ISSUES & PRS */}
              {activeTab === 'issues' && (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {issues.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#8C897F]">
                      No open issues or pull requests.
                    </div>
                  ) : (
                    issues.map((iss) => (
                      <a
                        key={iss.id}
                        href={iss.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] hover:border-[#D97757] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-start justify-between gap-3 transition-colors block group"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {iss.pull_request ? (
                            <GitPullRequest className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] group-hover:text-[#D97757] transition-colors leading-tight">
                              #{iss.number} {iss.title}
                            </div>
                            <div className="text-[10px] text-[#8C897F] mt-1 flex items-center gap-2 flex-wrap">
                              <span>opened by {iss.user.login}</span>
                              {iss.labels.map((l) => (
                                <span
                                  key={l.id}
                                  className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                                  style={{ backgroundColor: `#${l.color}20`, color: `#${l.color}` }}
                                >
                                  {l.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#8C897F] group-hover:text-[#D97757] shrink-0" />
                      </a>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: FILE TREE & VIEWER */}
              {activeTab === 'files' && (
                <div className="space-y-4">
                  {selectedFileContent ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB]/60">
                        <button
                          onClick={() => setSelectedFileContent(null)}
                          className="px-3 py-1 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Directory</span>
                        </button>
                        <span className="font-mono text-xs font-bold text-[#141413] dark:text-[#FAF9F5]">
                          {selectedFileContent.name}
                        </span>
                      </div>
                      <pre className="p-4 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] text-xs font-mono overflow-x-auto max-h-96 text-[#141413] dark:text-[#FAF9F5] leading-relaxed">
                        {selectedFileContent.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentPath && (
                        <button
                          onClick={() => {
                            const parts = currentPath.split('/');
                            parts.pop();
                            const parent = parts.join('/');
                            if (parent) fetchFolderContents(parent);
                            else fetchRepoData(selectedRepoName);
                          }}
                          className="px-3 py-1 text-xs font-bold text-[#D97757] flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>.. (Parent Folder)</span>
                        </button>
                      )}

                      <div className="divide-y divide-[#DFDACB]/60 dark:divide-[#2C2B27]/60 border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl overflow-hidden">
                        {files.map((item) => (
                          <div
                            key={item.path}
                            onClick={() => {
                              if (item.type === 'dir') {
                                fetchFolderContents(item.path);
                              } else {
                                fetchFileRaw(item);
                              }
                            }}
                            className="p-3 bg-white dark:bg-[#1A1917] hover:bg-[#FAF9F5] dark:hover:bg-[#1F1E1B] transition-colors flex items-center justify-between cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.type === 'dir' ? (
                                <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                              ) : (
                                <FileCode className="w-4 h-4 text-blue-500" />
                              )}
                              <span className="font-mono text-[#141413] dark:text-[#FAF9F5]">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#8C897F]">
                              {item.type === 'dir' ? 'Folder' : `${(item.size / 1024).toFixed(1)} KB`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-12 text-center text-xs text-[#8C897F]">
              Select or track a repository to load live GitHub data.
            </div>
          )}
        </div>

      </div>

      {/* GitHub PAT Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB]/60">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#D97757]" />
                <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                  GitHub Personal Access Token
                </h3>
              </div>
              <button onClick={() => setShowTokenModal(false)} className="text-xs text-[#8C897F]">
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8C897F] leading-relaxed">
              Adding a GitHub PAT (Personal Access Token) grants <strong>5,000 requests/hour</strong> and allows you to view your private coursework repositories.
            </p>

            <input
              type="password"
              value={patToken}
              onChange={(e) => setPatToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-2.5 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 text-xs font-bold text-[#8C897F] hover:text-[#141413]"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePat}
                className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                {tokenSaved ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{tokenSaved ? 'Saved!' : 'Save Token'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
