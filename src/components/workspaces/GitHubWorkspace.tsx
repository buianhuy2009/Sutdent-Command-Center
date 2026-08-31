import React, { useState } from 'react';
import {
  GitBranch,
  GitPullRequest,
  Star,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  FolderGit2,
  Clock,
  Code2,
  Search,
  BookOpen,
} from 'lucide-react';

interface GitHubRepo {
  id: string;
  name: string;
  owner: string;
  description: string;
  language: string;
  stars: number;
  openIssues: number;
  url: string;
  lastUpdated: string;
}

const DEFAULT_REPOS: GitHubRepo[] = [
  {
    id: 'repo-1',
    name: 'cs101-data-structures',
    owner: 'student',
    description: 'Coursework assignments: Binary search trees, hash tables, and graphs in Python & C++',
    language: 'Python',
    stars: 12,
    openIssues: 2,
    url: 'https://github.com',
    lastUpdated: '2 hours ago',
  },
  {
    id: 'repo-2',
    name: 'web-dev-term-project',
    owner: 'team-alpha',
    description: 'Fullstack React + Node.js collaborative student portal',
    language: 'TypeScript',
    stars: 5,
    openIssues: 4,
    url: 'https://github.com',
    lastUpdated: 'Yesterday',
  },
];

export const GitHubWorkspace: React.FC = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>(() => {
    try {
      const saved = localStorage.getItem('scc_github_repos');
      return saved ? JSON.parse(saved) : DEFAULT_REPOS;
    } catch {
      return DEFAULT_REPOS;
    }
  });

  const [newRepoOwner, setNewRepoOwner] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoLang, setNewRepoLang] = useState('Python');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;

    const item: GitHubRepo = {
      id: `repo-${Date.now()}`,
      name: newRepoName.trim(),
      owner: newRepoOwner.trim() || 'me',
      description: newRepoDesc.trim() || 'Personal or class project repository',
      language: newRepoLang,
      stars: 0,
      openIssues: 0,
      url: `https://github.com/${newRepoOwner.trim() || 'user'}/${newRepoName.trim()}`,
      lastUpdated: 'Just now',
    };

    const updated = [item, ...repos];
    setRepos(updated);
    try {
      localStorage.setItem('scc_github_repos', JSON.stringify(updated));
    } catch {}
    setNewRepoName('');
    setNewRepoOwner('');
    setNewRepoDesc('');
    setShowAddModal(false);
  };

  const handleDeleteRepo = (id: string) => {
    const updated = repos.filter((r) => r.id !== id);
    setRepos(updated);
    try {
      localStorage.setItem('scc_github_repos', JSON.stringify(updated));
    } catch {}
  };

  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md shadow-black/20">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                GitHub Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                Code &amp; Repositories
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Track project repositories, commits, assignment deadlines, and pull requests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Track Repository</span>
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>Open GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-[#8C897F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracked repositories..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-[#1A1917] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
          />
        </div>
        <span className="text-xs font-bold text-[#8C897F]">
          {filteredRepos.length} Repositories
        </span>
      </div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRepos.map((repo) => (
          <div
            key={repo.id}
            className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs hover:border-[#D97757]/60 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-[#D97757]" />
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5] hover:text-[#D97757] hover:underline"
                  >
                    {repo.owner}/{repo.name}
                  </a>
                </div>

                <button
                  onClick={() => handleDeleteRepo(repo.id)}
                  className="text-[#8C897F] hover:text-rose-500 transition-colors p-1 cursor-pointer"
                  title="Remove from tracker"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-[#8C897F] leading-relaxed line-clamp-2">
                {repo.description}
              </p>
            </div>

            <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between text-xs text-[#8C897F]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <strong className="text-[#141413] dark:text-[#FAF9F5]">{repo.language}</strong>
                </span>
                <span>•</span>
                <span>Updated {repo.lastUpdated}</span>
              </div>

              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D97757] font-bold hover:underline flex items-center gap-1 text-xs"
              >
                <span>View Code</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Repo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB] dark:border-[#2C2B27]">
              <h3 className="text-base font-bold text-[#141413] dark:text-[#FAF9F5]">
                Track a GitHub Repository
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8C897F] hover:text-[#141413] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRepo} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                  Repository Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="e.g. machine-learning-assignment-2"
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                  Owner / Organization (Optional)
                </label>
                <input
                  type="text"
                  value={newRepoOwner}
                  onChange={(e) => setNewRepoOwner(e.target.value)}
                  placeholder="e.g. github-username or class-org"
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                  Primary Language
                </label>
                <select
                  value={newRepoLang}
                  onChange={(e) => setNewRepoLang(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
                >
                  <option value="Python">Python</option>
                  <option value="TypeScript">TypeScript / JavaScript</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                  <option value="Rust">Rust</option>
                  <option value="Go">Go</option>
                  <option value="HTML/CSS">HTML/CSS</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                  Description / Milestone Goal
                </label>
                <textarea
                  rows={2}
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  placeholder="e.g. Final project milestone due Friday"
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add to Tracked Repos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
