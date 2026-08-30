import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  RefreshCw,
  Bot,
  User as UserIcon,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { sendStudyAssistantMessage } from '../services/gemini';
import { Assignment, CalendarEvent, EmailAlert } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StudyAssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: Assignment[];
  events: CalendarEvent[];
  alerts: EmailAlert[];
  isFullScreen?: boolean;
}

export const StudyAssistantChat: React.FC<StudyAssistantChatProps> = ({
  isOpen,
  onClose,
  assignments,
  events,
  alerts,
  isFullScreen = true,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "👋 Hi! I'm your **Student Command Coach**. I have full context on your schedule, assignments, and scanned teacher emails. How can I help you optimize your study flow today?",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsSending(true);

    try {
      const response = await sendStudyAssistantMessage(
        [...messages, userMessage],
        { assignments, events, alerts }
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "⚠️ Sorry, I encountered an issue connecting to Gemini. Please verify your GEMINI_API_KEY and try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const promptSuggestions = [
    'Prioritize my assignments for tonight',
    'How should I break down my Physics Lab 3?',
    'Draft a polite extension request email',
    'Give me a 45-minute study plan',
  ];

  if (isFullScreen) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#FAF9F6] dark:bg-[#0F172A] overflow-hidden animate-in fade-in duration-200">
        {/* Top Bar with Prominent Return Button */}
        <div className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-indigo-200/80 dark:border-indigo-800 shadow-2xs"
              title="Return to Workspace"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Workspace</span>
            </button>
            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  AI Study Coach
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Powered by Gemini 2.5 Flash
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              setMessages([
                {
                  role: 'assistant',
                  content: "Chat cleared! What else would you like help with today?",
                },
              ])
            }
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2.5 text-slate-400 text-xs py-2">
                <Bot className="w-5 h-5 text-indigo-500 animate-pulse" />
                <span className="animate-pulse font-medium">Analyzing your assignments and drafting response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested Prompt Chips */}
        {messages.length < 4 && (
          <div className="px-4 sm:px-6 py-2 border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-800/40">
            <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto scrollbar-none">
              {promptSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="text-xs font-medium px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Input Box */}
        <div className="p-4 sm:p-6 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask your coach anything about homework, deadlines, or test prep..."
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isSending}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Slide-over Drawer Fallback
  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-full sm:w-96 max-w-[calc(100vw-2rem)] h-[540px] max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
      id="ai-study-coach-pane"
    >
      <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h4 className="text-xs font-bold leading-none">AI Study Coach</h4>
            <p className="text-[10px] text-indigo-100 mt-0.5">Powered by Gemini Flash</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setMessages([
                {
                  role: 'assistant',
                  content: "Chat cleared! How else can I help you tackle your schoolwork?",
                },
              ])
            }
            className="p-1 rounded-md text-indigo-200 hover:text-white hover:bg-white/10"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-indigo-200 hover:text-white hover:bg-white/10"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[82%] p-2.5 rounded-xl ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
              }`}
            >
              <div className="prose prose-xs dark:prose-invert max-w-none leading-relaxed">
                <Markdown>{msg.content}</Markdown>
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
            <Bot className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span className="animate-pulse font-medium">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask a question..."
          className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isSending}
          className="p-2 bg-indigo-600 text-white rounded-xl"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
