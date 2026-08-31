import React, { useState } from 'react';
import {
  MessageSquare,
  ExternalLink,
  Plus,
  Trash2,
  Hash,
  Volume2,
  Users,
  Radio,
} from 'lucide-react';

interface StudyServer {
  id: string;
  name: string;
  type: 'discord' | 'slack';
  channelCount: number;
  members: number;
  url: string;
  notes: string;
}

const DEFAULT_SERVERS: StudyServer[] = [
  {
    id: 'srv-1',
    name: 'University CS & Engineering Hub',
    type: 'discord',
    channelCount: 14,
    members: 420,
    url: 'https://discord.com/app',
    notes: '#homework-help, #algorithms-study-group, #office-hours-voice',
  },
  {
    id: 'srv-2',
    name: 'Physics & STEM Collaborative',
    type: 'discord',
    channelCount: 8,
    members: 185,
    url: 'https://discord.com/app',
    notes: '#general-mechanics, #lab-reports, #calculus-derivatives',
  },
  {
    id: 'srv-3',
    name: 'Course Workspace (Fall 2026)',
    type: 'slack',
    channelCount: 6,
    members: 65,
    url: 'https://slack.com',
    notes: '#proj-team-alpha, #announcements, #ta-help-desk',
  },
];

export const DiscordSlackWorkspace: React.FC = () => {
  const [servers, setServers] = useState<StudyServer[]>(() => {
    try {
      const saved = localStorage.getItem('scc_study_servers');
      return saved ? JSON.parse(saved) : DEFAULT_SERVERS;
    } catch {
      return DEFAULT_SERVERS;
    }
  });

  const [name, setName] = useState('');
  const [type, setType] = useState<'discord' | 'slack'>('discord');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleAddServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const item: StudyServer = {
      id: `srv-${Date.now()}`,
      name: name.trim(),
      type,
      channelCount: 5,
      members: 50,
      url: url.trim() || (type === 'discord' ? 'https://discord.com/app' : 'https://slack.com'),
      notes: notes.trim() || 'General study channels',
    };

    const updated = [item, ...servers];
    setServers(updated);
    try {
      localStorage.setItem('scc_study_servers', JSON.stringify(updated));
    } catch {}
    setName('');
    setUrl('');
    setNotes('');
    setShowAdd(false);
  };

  const handleDeleteServer = (id: string) => {
    const updated = servers.filter((s) => s.id !== id);
    setServers(updated);
    try {
      localStorage.setItem('scc_study_servers', JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Discord &amp; Slack Study Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                Community
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Launch university study servers, course Slack channels, and voice study rooms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Server</span>
          </button>

          <a
            href="https://discord.com/app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>Open Discord</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Add Server Drawer */}
      {showAdd && (
        <form onSubmit={handleAddServer} className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
            Add Study Server / Channel Bookmark
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                Server Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Organic Chemistry Study Group"
                className="w-full px-3.5 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                Platform
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
              >
                <option value="discord">Discord Server</option>
                <option value="slack">Slack Workspace</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
              Invite / Channel Web Link
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://discord.gg/... or https://workspace.slack.com"
              className="w-full px-3.5 py-2 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Server
            </button>
          </div>
        </form>
      )}

      {/* Servers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((srv) => (
          <div
            key={srv.id}
            className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#D97757]/60 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                      srv.type === 'discord' ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`}
                  >
                    {srv.type === 'discord' ? 'D' : 'S'}
                  </div>
                  <h3 className="text-xs font-bold text-[#141413] dark:text-[#FAF9F5] leading-tight">
                    {srv.name}
                  </h3>
                </div>

                <button
                  onClick={() => handleDeleteServer(srv.id)}
                  className="text-[#8C897F] hover:text-rose-500 transition-colors p-1 cursor-pointer"
                  title="Remove server"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] text-xs text-[#8C897F] leading-relaxed">
                {srv.notes}
              </div>
            </div>

            <div className="pt-3 border-t border-[#DFDACB]/60 dark:border-[#2C2B27]/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#8C897F]">
                <Users className="w-3.5 h-3.5" />
                <span>{srv.members} members</span>
              </div>

              <a
                href={srv.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Launch</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
