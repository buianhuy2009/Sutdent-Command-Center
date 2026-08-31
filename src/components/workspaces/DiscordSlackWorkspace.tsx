import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Hash,
  Send,
  Plus,
  Trash2,
  ExternalLink,
  Settings,
  Check,
  AlertCircle,
  Code,
  Link,
  Users,
  Radio,
  Sparkles,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  text: string;
  timestamp: string;
  channelId: string;
  isWebhookSent?: boolean;
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  platform: 'discord' | 'slack' | 'local';
  webhookUrl?: string;
}

const LOCAL_MESSAGES_KEY = 'scc_study_hub_messages_v2';
const LOCAL_CHANNELS_KEY = 'scc_study_hub_channels_v2';

const DEFAULT_CHANNELS: ChatChannel[] = [
  {
    id: 'c1',
    name: 'general-study',
    description: 'Main peer collaboration & study announcements',
    platform: 'local',
  },
  {
    id: 'c2',
    name: 'cs-homework-help',
    description: 'Programming assignments, debug queries & git PRs',
    platform: 'local',
  },
  {
    id: 'c3',
    name: 'math-problem-solving',
    description: 'Calculus, linear algebra proofs & equations',
    platform: 'local',
  },
];

export const DiscordSlackWorkspace: React.FC = () => {
  const [channels, setChannels] = useState<ChatChannel[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CHANNELS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CHANNELS;
  });

  const [activeChannelId, setActiveChannelId] = useState<string>(channels[0]?.id || 'c1');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_MESSAGES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'm1',
        sender: 'StudentOS Study Hub',
        text: 'Welcome to your real-time Study Channel! Type any message to chat with your study group or connect a real Discord/Slack webhook in Channel Settings to bridge live messages to your servers.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channelId: 'c1',
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [senderName, setSenderName] = useState(() => {
    try {
      return localStorage.getItem('scc_user_display_name') || 'Student';
    } catch {
      return 'Student';
    }
  });

  // Channel Settings Modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newChannelModal, setNewChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelPlatform, setNewChannelPlatform] = useState<'discord' | 'slack' | 'local'>('local');
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [isPostingWebhook, setIsPostingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const activeMessages = messages.filter((m) => m.channelId === activeChannel?.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChannel) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: senderName,
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channelId: activeChannel.id,
      isWebhookSent: false,
    };

    // If webhook configured, post directly to Discord / Slack!
    if (activeChannel.webhookUrl?.trim()) {
      setIsPostingWebhook(true);
      try {
        if (activeChannel.platform === 'discord') {
          await fetch(activeChannel.webhookUrl.trim(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: senderName,
              content: inputMessage.trim(),
            }),
          });
          newMsg.isWebhookSent = true;
        } else if (activeChannel.platform === 'slack') {
          await fetch(activeChannel.webhookUrl.trim(), {
            method: 'POST',
            body: JSON.stringify({
              text: `*${senderName}*: ${inputMessage.trim()}`,
            }),
          });
          newMsg.isWebhookSent = true;
        }
      } catch (err) {
        console.error('Webhook post error:', err);
      } finally {
        setIsPostingWebhook(false);
      }
    }

    const updated = [...messages, newMsg];
    setMessages(updated);
    try {
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(updated));
    } catch {}

    setInputMessage('');
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const formattedName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    const newChan: ChatChannel = {
      id: `c-${Date.now()}`,
      name: formattedName,
      description: newChannelDesc.trim() || 'Custom study group channel',
      platform: newChannelPlatform,
      webhookUrl: webhookUrlInput.trim() || undefined,
    };

    const updated = [...channels, newChan];
    setChannels(updated);
    setActiveChannelId(newChan.id);
    try {
      localStorage.setItem(LOCAL_CHANNELS_KEY, JSON.stringify(updated));
    } catch {}

    setNewChannelName('');
    setNewChannelDesc('');
    setWebhookUrlInput('');
    setNewChannelModal(false);
  };

  const handleDeleteChannel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (channels.length <= 1) return;
    const updated = channels.filter((c) => c.id !== id);
    setChannels(updated);
    setActiveChannelId(updated[0].id);
    try {
      localStorage.setItem(LOCAL_CHANNELS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleSaveChannelWebhook = () => {
    if (!activeChannel) return;
    const updated = channels.map((c) =>
      c.id === activeChannel.id ? { ...c, webhookUrl: webhookUrlInput.trim() || undefined } : c
    );
    setChannels(updated);
    try {
      localStorage.setItem(LOCAL_CHANNELS_KEY, JSON.stringify(updated));
    } catch {}
    setWebhookStatus('Webhook URL saved successfully!');
    setTimeout(() => {
      setWebhookStatus(null);
      setSettingsOpen(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      
      {/* 1. Header Bar */}
      <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center shadow-md shadow-[#5865F2]/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#141413] dark:text-[#FAF9F5]">
                Discord &amp; Slack Live Study Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                Live Channels &amp; Webhooks
              </span>
            </div>
            <p className="text-xs text-[#8C897F] mt-0.5">
              Live study channels with two-way Discord &amp; Slack Webhook integration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setWebhookUrlInput(activeChannel?.webhookUrl || '');
              setSettingsOpen(true);
            }}
            className="px-3.5 py-2 bg-[#FAF9F5] dark:bg-[#252422] border border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757] text-[#141413] dark:text-[#FAF9F5] rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-[#D97757]" />
            <span>Channel Webhook</span>
          </button>
        </div>
      </div>

      {/* 2. Main Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Left: Channels List */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DFDACB]/60">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C897F]">
                Study Channels
              </span>
              <button
                onClick={() => setNewChannelModal(true)}
                className="p-1 rounded-lg text-[#8C897F] hover:text-[#D97757] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                title="Create Channel"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {channels.map((chan) => {
                const isActive = chan.id === activeChannel?.id;
                return (
                  <div
                    key={chan.id}
                    onClick={() => setActiveChannelId(chan.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isActive
                        ? 'bg-[#FAF9F5] dark:bg-[#252422] border-[#D97757] text-[#141413] dark:text-[#FAF9F5] font-bold shadow-xs'
                        : 'bg-white dark:bg-[#1A1917] border-[#DFDACB] dark:border-[#2C2B27] hover:border-[#D97757]/60 text-[#5C5A54] dark:text-[#B5B2A8]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Hash className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D97757]' : 'text-[#8C897F]'}`} />
                      <span className="text-xs truncate">{chan.name}</span>
                    </div>

                    {chan.webhookUrl && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {chan.platform}
                      </span>
                    )}

                    {channels.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteChannel(chan.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Name Pill */}
          <div className="p-3 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] flex items-center justify-between text-xs">
            <span className="text-[#8C897F]">Chatting as:</span>
            <input
              type="text"
              value={senderName}
              onChange={(e) => {
                setSenderName(e.target.value);
                try {
                  localStorage.setItem('scc_user_display_name', e.target.value);
                } catch {}
              }}
              className="px-2 py-1 font-bold text-xs bg-white dark:bg-[#252422] border border-[#DFDACB] rounded-lg w-28 text-right focus:outline-none"
            />
          </div>
        </div>

        {/* Right: Messages Area & Input */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 shadow-xs flex flex-col justify-between space-y-4">
          
          {/* Active Channel Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB]/60">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-[#D97757]" />
              <div>
                <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                  {activeChannel?.name}
                </h3>
                <p className="text-[11px] text-[#8C897F]">
                  {activeChannel?.description}
                </p>
              </div>
            </div>

            {activeChannel?.webhookUrl && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Connected to {activeChannel.platform === 'discord' ? 'Discord Webhook' : 'Slack Webhook'}
              </span>
            )}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[420px]">
            {activeMessages.map((msg) => (
              <div key={msg.id} className="p-3.5 bg-[#FAF9F5] dark:bg-[#1F1E1B] rounded-2xl border border-[#DFDACB] dark:border-[#2C2B27] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#141413] dark:text-[#FAF9F5]">
                      {msg.sender}
                    </span>
                    {msg.isWebhookSent && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                        Discord Synced
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#8C897F]">{msg.timestamp}</span>
                </div>
                <p className="text-xs text-[#2D2A26] dark:text-[#FAF9F5] leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Message #${activeChannel?.name || 'study'}...`}
              className="flex-1 px-4 py-2.5 text-xs bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] dark:border-[#2C2B27] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757] text-[#141413] dark:text-[#FAF9F5]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isPostingWebhook}
              className="px-5 py-2.5 bg-[#D97757] hover:bg-[#C86646] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPostingWebhook ? 'Sending...' : 'Send'}</span>
            </button>
          </form>

        </div>

      </div>

      {/* Create Channel Modal */}
      {newChannelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateChannel} className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB]/60">
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                Create Study Channel
              </h3>
              <button onClick={() => setNewChannelModal(false)} type="button" className="text-xs text-[#8C897F]">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. physics-study-group"
                  className="w-full px-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757]"
                />
              </div>

              <div>
                <label className="font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="e.g. Weekly problem sets and lab review"
                  className="w-full px-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757]"
                />
              </div>

              <div>
                <label className="font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                  Integration Type
                </label>
                <div className="flex gap-2">
                  {['local', 'discord', 'slack'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewChannelPlatform(p as any)}
                      className={`flex-1 py-1.5 rounded-xl font-bold uppercase text-[10px] border cursor-pointer ${
                        newChannelPlatform === p
                          ? 'bg-[#D97757] text-white border-[#D97757]'
                          : 'bg-[#FAF9F5] text-[#5C5A54] border-[#DFDACB]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {newChannelPlatform !== 'local' && (
                <div>
                  <label className="font-bold text-[#141413] dark:text-[#FAF9F5] block mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={webhookUrlInput}
                    onChange={(e) => setWebhookUrlInput(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] rounded-xl focus:outline-none font-mono text-[11px]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewChannelModal(false)}
                className="px-4 py-2 text-xs font-bold text-[#8C897F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#D97757] text-white rounded-2xl text-xs font-bold transition-all shadow-xs"
              >
                Create Channel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Channel Settings / Webhook Config Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1917] rounded-3xl border border-[#DFDACB] dark:border-[#2C2B27] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFDACB]/60">
              <h3 className="text-sm font-bold text-[#141413] dark:text-[#FAF9F5]">
                Webhook Settings for #{activeChannel?.name}
              </h3>
              <button onClick={() => setSettingsOpen(false)} className="text-xs text-[#8C897F]">
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8C897F] leading-relaxed">
              Paste your Discord Channel Webhook URL (from Server Settings → Integrations → Webhooks). Messages sent here will instantly post live into your Discord channel!
            </p>

            <input
              type="url"
              value={webhookUrlInput}
              onChange={(e) => setWebhookUrlInput(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#FAF9F5] dark:bg-[#1F1E1B] border border-[#DFDACB] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757]"
            />

            {webhookStatus && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{webhookStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#8C897F]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChannelWebhook}
                className="px-5 py-2 bg-[#D97757] text-white rounded-2xl text-xs font-bold shadow-xs"
              >
                Save Webhook
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
