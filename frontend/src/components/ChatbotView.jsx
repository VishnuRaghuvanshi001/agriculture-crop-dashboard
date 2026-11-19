import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Key, Trash2, Download, Sparkles, Copy, Check,
  AlertTriangle, ExternalLink, X, Zap, ShieldCheck, StopCircle
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import {
  streamGroqChat,
  AVAILABLE_MODELS,
  fetchLiveGroqModels,
  getStoredApiKey,
  setStoredApiKey,
  clearStoredApiKey,
  hasApiKey
} from '../services/groqService';
import { buildAgriSystemPrompt, getQuickPrompts } from '../services/agriPromptContext';
import { playClickSound, playSwitchSound, playSuccessChord } from '../soundEffects';

export default function ChatbotView({
  data,
  selectedState = 'Punjab',
  selectedCrop = 'Wheat',
  excludeCoconut = false,
  initialPrompt = '',
  onClearInitialPrompt,
  onSelectState,
  onSelectCrop
}) {
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState(initialPrompt || '');
  const [selectedModel, setSelectedModel] = useState('openai/gpt-oss-120b');
  const [activeState, setActiveState] = useState(selectedState || 'All India');
  const [activeCrop, setActiveCrop] = useState(selectedCrop || 'All Crops');
  const [liveModels, setLiveModels] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStats, setGenerationStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredApiKey());
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [keyConfigured, setKeyConfigured] = useState(() => hasApiKey());
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync state if changed from other tabs
  useEffect(() => {
    if (selectedState) {
      setActiveState(selectedState);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedCrop) {
      setActiveCrop(selectedCrop);
    }
  }, [selectedCrop]);

  const handleStateChange = (newState) => {
    playSwitchSound();
    setActiveState(newState);
    if (newState !== 'All India' && onSelectState) {
      onSelectState(newState);
    }
  };

  const handleCropChange = (newCrop) => {
    playSwitchSound();
    setActiveCrop(newCrop);
    if (newCrop !== 'All Crops' && onSelectCrop) {
      onSelectCrop(newCrop);
    }
  };

  // Discover live models from user's account on mount
  useEffect(() => {
    if (hasApiKey()) {
      fetchLiveGroqModels().then((models) => {
        if (models && models.length > 0) {
          setLiveModels(models);
        }
      });
    }
  }, []);

  // If initialPrompt arrives from Quick Floating Widget
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      setInputPrompt(initialPrompt.trim());
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Suggested contextual prompts based on active state & crop
  const quickPrompts = useMemo(() => {
    return getQuickPrompts({ activeState, activeCrop });
  }, [activeState, activeCrop]);

  // Save API key
  const handleSaveApiKey = async () => {
    playClickSound();
    if (apiKeyInput.trim()) {
      const key = apiKeyInput.trim();
      setStoredApiKey(key);
      setKeyConfigured(true);
      setShowKeyModal(false);
      setErrorMessage(null);
      try {
        const models = await fetchLiveGroqModels(key);
        if (models && models.length > 0) {
          setLiveModels(models);
        }
      } catch (_e) {
        // Fallback to static model list
      }
    }
  };

  // Clear API key
  const handleClearApiKey = () => {
    playSwitchSound();
    clearStoredApiKey();
    setApiKeyInput('');
    setKeyConfigured(false);
  };

  // Send message
  const handleSendMessage = async (textToSend = null) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isGenerating) return;

    playClickSound();

    // Check if API key is configured
    if (!hasApiKey()) {
      setShowKeyModal(true);
      return;
    }

    setErrorMessage(null);
    setInputPrompt('');

    const userMessage = { role: 'user', content: prompt, timestamp: new Date().toLocaleTimeString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Placeholder assistant message for streaming
    const assistantIndex = updatedMessages.length;
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: '',
        model: selectedModel,
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true
      }
    ]);

    setIsGenerating(true);
    setGenerationStats(null);

    // Build grounding system prompt with user query for smart entity detection
    const systemPrompt = buildAgriSystemPrompt({
      data,
      activeState,
      activeCrop,
      userQuery: prompt,
      excludeCoconut
    });

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    abortControllerRef.current = new AbortController();

    try {
      await streamGroqChat({
        messages: apiMessages,
        model: selectedModel,
        signal: abortControllerRef.current.signal,
        onChunk: (accumulated) => {
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = {
                ...next[assistantIndex],
                content: accumulated
              };
            }
            return next;
          });
        },
        onDone: (finalText, metrics) => {
          setIsGenerating(false);
          setGenerationStats(metrics);
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = {
                ...next[assistantIndex],
                content: finalText,
                isStreaming: false
              };
            }
            return next;
          });
          playSuccessChord();
        },
        onError: (err) => {
          setIsGenerating(false);
          setErrorMessage(err.message || 'Error connecting to Groq Cloud inference.');
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantIndex] && !next[assistantIndex].content) {
              return next.slice(0, -1); // Remove empty assistant bubble
            }
            if (next[assistantIndex]) {
              next[assistantIndex].isStreaming = false;
            }
            return next;
          });
        }
      });
    } catch (_err) {
      // Handled in onError callback
    }
  };

  // Stop ongoing stream
  const handleStopGeneration = () => {
    playSwitchSound();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  // Clear chat
  const handleClearChat = () => {
    playSwitchSound();
    setMessages([]);
    setErrorMessage(null);
    setGenerationStats(null);
  };

  // Export chat transcript
  const handleExportChat = () => {
    playClickSound();
    if (messages.length === 0) return;
    const text = messages
      .map(m => `[${m.timestamp}] ${m.role.toUpperCase()}:\n${m.content}\n\n`)
      .join('---\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `krishi-ai-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy assistant response
  const handleCopyMessage = (content, index) => {
    playClickSound();
    navigator.clipboard?.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Cyberpunk Command Header */}
      <div className="glass-panel p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-emerald-400 to-teal-500 p-0.5 shadow-lg shadow-cyan-500/25">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-white">
                  KRISHI AI // COGNITIVE AGRONOMIST
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Zap size={10} className="text-cyan-400" /> GROQ LPU
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Autonomous advisory engine grounded in ICAR agronomy, NBSS&LUP soils & 19,689 historical records
              </p>
            </div>
          </div>

          {/* Model Selector & Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Model Dropdown */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => {
                  playSwitchSound();
                  setSelectedModel(e.target.value);
                }}
                disabled={isGenerating}
                className="bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
              >
                <optgroup label="Recommended Models" className="bg-slate-900 text-cyan-400 font-bold">
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                      {m.name} ({m.badge})
                    </option>
                  ))}
                </optgroup>
                {liveModels.length > 0 && (
                  <optgroup label="All Models On Your Account" className="bg-slate-900 text-emerald-400 font-bold">
                    {liveModels
                      .filter((id) => !AVAILABLE_MODELS.some((m) => m.id === id))
                      .map((id) => (
                        <option key={id} value={id} className="bg-slate-900 text-slate-200">
                          {id}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* API Key Modal Button */}
            <button
              onClick={() => {
                playClickSound();
                setShowKeyModal(true);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                keyConfigured
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 animate-pulse'
              }`}
            >
              <Key size={13} className={keyConfigured ? 'text-emerald-400' : 'text-amber-400'} />
              <span>{keyConfigured ? 'API Key Active' : 'Set Groq Key'}</span>
            </button>

            {/* Clear Chat */}
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}

            {/* Export Chat */}
            {messages.length > 0 && (
              <button
                onClick={handleExportChat}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Export transcript"
              >
                <Download size={13} />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Context Bar with Interactive Selectors */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2.5">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="text-slate-500 font-bold">FOCUS CONTEXT:</span>

            {/* State Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-cyan-500/30 rounded-xl px-2.5 py-1">
              <span className="text-slate-400">📍</span>
              <select
                value={activeState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All India" className="bg-slate-900 text-cyan-300 font-bold">
                  All India (Pan-India)
                </option>
                {(data?.all_states || []).map((st) => (
                  <option key={st} value={st} className="bg-slate-900 text-slate-200">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/30 rounded-xl px-2.5 py-1">
              <span className="text-slate-400">🌾</span>
              <select
                value={activeCrop}
                onChange={(e) => handleCropChange(e.target.value)}
                className="bg-transparent text-emerald-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All Crops" className="bg-slate-900 text-emerald-300 font-bold">
                  All Crops (National)
                </option>
                {(data?.all_crops || []).map((cr) => (
                  <option key={cr} value={cr} className="bg-slate-900 text-slate-200">
                    {cr}
                  </option>
                ))}
              </select>
            </div>

            {excludeCoconut && (
              <span className="px-2 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30">
                🥥 Coconut Filter Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span className="hidden sm:inline">BENCHMARKS: ICAR • NBSS&LUP</span>
            {generationStats && (
              <span className="text-emerald-400 font-bold">
                ⚡ {generationStats.tokensPerSec} tok/s ({generationStats.durationSec.toFixed(1)}s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="glass-panel p-4 border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <div>
              <span className="font-semibold">{errorMessage}</span>
              {errorMessage.toLowerCase().includes('does not exist') && (
                <div className="text-[11px] text-rose-300/80 mt-1">
                  Model deprecation notice: Groq has transitioned to the official flagships <code>openai/gpt-oss-120b</code> and <code>openai/gpt-oss-20b</code>.
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {errorMessage.toLowerCase().includes('does not exist') && (
              <button
                onClick={() => {
                  playClickSound();
                  setSelectedModel('openai/gpt-oss-120b');
                  setErrorMessage(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold transition-colors cursor-pointer border border-cyan-500/40"
              >
                Switch to GPT-OSS 120B
              </button>
            )}
            <button
              onClick={() => setShowKeyModal(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Configure Key
            </button>
          </div>
        </div>
      )}

      {/* Main Conversation Canvas */}
      <div className="glass-panel p-4 md:p-6 min-h-[520px] flex flex-col justify-between">
        {/* Messages Stream */}
        <div className="space-y-5 overflow-y-auto max-h-[600px] pr-2">
          {messages.length === 0 ? (
            /* Empty State & Quick Prompts */
            <div className="py-8 space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30 mx-auto flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-100">
                  Welcome to Krishi AI Knowledge Engine
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ask any agronomic question, compare crop water footprints, simulate climate risks, or analyze 1997–2020 state production patterns. Grounded in official Indian agricultural research benchmarks.
                </p>
              </div>

              {/* Quick Prompts Grid */}
              <div className="space-y-2 max-w-4xl mx-auto">
                <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2 px-1">
                  <Zap size={13} className="text-cyan-400" />
                  <span>SUGGESTED RESEARCH PROMPTS:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {quickPrompts.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-400/50 text-left transition-all duration-200 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Rendered Messages */
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 p-0.5 shrink-0 mt-1 shadow-md shadow-cyan-500/20">
                      <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                        <Bot size={16} className="text-cyan-400" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 text-slate-100 rounded-tr-none'
                        : 'bg-slate-900/80 border border-slate-700/60 text-slate-200 rounded-tl-none shadow-xl'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2 text-[10px] font-mono text-slate-400 pb-1.5 border-b border-slate-700/40">
                      <span className={isUser ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                        {isUser ? 'RESEARCHER' : 'KRISHI AI COPILOT'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        {!isUser && !msg.isStreaming && msg.content && (
                          <button
                            onClick={() => handleCopyMessage(msg.content, idx)}
                            className="hover:text-cyan-300 transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedIndex === idx ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {isUser ? (
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    ) : (
                      <div>
                        {msg.content ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : msg.isStreaming ? (
                          <div className="flex items-center gap-2 text-cyan-400 text-xs py-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                            <span>Synthesizing ICAR agronomic models via Groq LPU...</span>
                          </div>
                        ) : null}

                        {msg.isStreaming && msg.content && (
                          <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1 align-middle" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="mt-5 pt-3 border-t border-slate-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2.5"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  keyConfigured
                    ? (activeCrop !== 'All Crops' || activeState !== 'All India')
                      ? `Ask Krishi AI about ${activeCrop}, ${activeState} soil, water benchmarks, or any Indian region/crop...`
                      : 'Ask Krishi AI about any crop, state soil, water benchmarks, or ICAR recommendations...'
                    : 'Configure your free Groq API key to unlock Krishi AI...'
                }
                rows={2}
                disabled={isGenerating}
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl p-3 pr-10 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
              />
              <div className="absolute right-3 bottom-3 text-[10px] font-mono text-slate-600 hidden md:block">
                Enter ↵
              </div>
            </div>

            {isGenerating ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="h-11 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <StopCircle size={15} />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputPrompt.trim()}
                className={`h-11 px-5 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-lg ${
                  inputPrompt.trim()
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:shadow-cyan-500/30 font-bold'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <Send size={15} />
              </button>
            )}
          </form>

          {/* Quick Context Switchers */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-1 font-mono">
              <span className="text-cyan-400">⚡ Auto-Entity Extraction:</span>
              <span>Mention any state or crop in your query to target it dynamically</span>
            </div>
            <span className="font-mono text-slate-400">Powered by Groq Cloud LPU Inference</span>
          </div>
        </div>
      </div>

      {/* Groq API Key Configuration Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="glass-panel w-full max-w-lg p-6 relative border-cyan-500/40 shadow-2xl bg-slate-900/95"
            >
              <button
                onClick={() => setShowKeyModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-100">
                    Groq Cloud API Key
                  </h3>
                  <p className="text-xs text-slate-400">
                    Unlock ultra-low latency LPU reasoning directly in your browser
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-200 font-semibold">
                    <span>How to get a key:</span>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline font-mono text-[11px]"
                    >
                      <span>console.groq.com/keys</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px]">
                    <li>Sign up for a free Groq account (takes 30 seconds).</li>
                    <li>Generate an API key under <strong>API Keys</strong>.</li>
                    <li>Paste it below. It is saved strictly in your local browser storage.</li>
                  </ol>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold text-slate-400">
                    GROQ API KEY (Starts with gsk_...)
                  </label>
                  <div className="relative">
                    <input
                      type={showKeySecret ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-20 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeySecret(!showKeySecret)}
                      className="absolute right-3 top-2.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showKeySecret ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-emerald-400/90 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span>Client-side only: Never transmitted to any third-party server besides Groq.</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {keyConfigured && (
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      Remove Key
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setShowKeyModal(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyInput.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Save & Activate
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
