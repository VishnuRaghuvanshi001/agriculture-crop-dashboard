import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Maximize2, Send, Sparkles } from 'lucide-react';
import { playClickSound, playSwitchSound } from '../soundEffects';

export default function FloatingChatWidget({
  activeTab,
  onOpenFullChat,
  selectedState,
  selectedCrop,
  onQuickQuery
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [quickInput, setQuickInput] = useState('');

  // Hide the floating button if already on the main chat tab
  if (activeTab === 'chat') {
    return null;
  }

  const handleToggle = () => {
    playSwitchSound();
    setIsOpen(!isOpen);
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    playClickSound();
    const query = quickInput.trim();
    setQuickInput('');
    setIsOpen(false);
    if (onQuickQuery) {
      onQuickQuery(query);
    } else if (onOpenFullChat) {
      onOpenFullChat();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-3 w-80 md:w-96 glass-panel p-4 shadow-2xl border-cyan-500/40 bg-slate-900/95"
          >
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center text-slate-950">
                  <Bot size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Krishi AI Quick Copilot</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                      GROQ
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Inspecting {selectedState} • {selectedCrop}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    playClickSound();
                    setIsOpen(false);
                    onOpenFullChat();
                  }}
                  className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
                  title="Expand to Full Copilot Tab"
                >
                  <Maximize2 size={13} />
                </button>
                <button
                  onClick={handleToggle}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-2">
              <p className="text-[11px] text-slate-300 leading-snug">
                Ask a quick agronomic question about the current view:
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder={`e.g. Is ${selectedCrop} suitable for ${selectedState}?`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!quickInput.trim()}
                  className="absolute right-2 top-2 p-1 text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 transition-colors cursor-pointer"
                >
                  <Send size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsOpen(false);
                    onOpenFullChat();
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 font-mono"
                >
                  <Sparkles size={11} /> Open Full Copilot Workspace
                </button>
                <span className="text-[10px] text-slate-500 font-mono">Press ↵</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Pill */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-xl shadow-cyan-500/25 cursor-pointer border border-cyan-300/40"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-300" />
        </span>
        <Bot size={18} className="group-hover:rotate-12 transition-transform duration-300" />
        <span className="text-xs font-mono tracking-wider">KRISHI AI</span>
      </motion.button>
    </div>
  );
}
