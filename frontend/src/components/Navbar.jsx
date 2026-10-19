import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Map, BarChart3, Globe, Database, Moon, Sun, CloudRain } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activeYear, setActiveYear, theme, setTheme }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'map', label: 'Spatial Map', icon: Map },
    { id: 'state', label: 'State Explorer', icon: Globe },
    { id: 'crop', label: 'Crop Intelligence', icon: Sprout },
    { id: 'data', label: 'Records & Export', icon: Database },
  ];

  const years = ['All', '2019', '2018', '2017', '2016', '2015'];

  return (
    <header className="w-full mb-6 z-50">
      <div className="glass-panel px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-black text-xl">
            🌾
          </div>
          <div>
            <div className="font-extrabold tracking-wider text-base flex items-center gap-1.5">
              <span>AGRI-INTELLIGENCE</span>
              <span className="text-cyan-400 font-mono">//</span>
              <span className="text-emerald-400 font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                INDIA
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Agrotechnical Analytics & Forecasting</div>
          </div>
        </div>

        {/* Central Navigation Pills */}
        <nav className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isActive
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-400/40 rounded-xl shadow-lg shadow-cyan-500/10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Year Selector & Theme Switcher */}
        <div className="flex items-center gap-3">
          {/* Year Pills */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/40 text-xs font-mono">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeYear === y
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/40">
            <button
              onClick={() => setTheme('dark')}
              title="Cyberpunk Dark"
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon size={14} />
            </button>
            <button
              onClick={() => setTheme('slate')}
              title="Slate Neumorphic"
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'slate' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudRain size={14} />
            </button>
            <button
              onClick={() => setTheme('light')}
              title="Clean Light"
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'light' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
