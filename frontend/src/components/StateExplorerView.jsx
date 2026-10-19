import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatLargeNumber } from '../utils';
import { Globe, MapPin, Sparkles, Droplets, Calendar, ShieldCheck } from 'lucide-react';

export default function StateExplorerView({ data, selectedState, onSelectState }) {
  const [activeState, setActiveState] = useState(selectedState || 'Punjab');
  const allStates = data.all_states;

  const sp = data.state_profiles[activeState] || {
    zone: 'Northern Plains',
    climate_desc: 'Sub-tropical monsoon',
    primary_season: 'Kharif & Rabi',
    soils: ['Alluvial Loam', 'Clay Loam'],
    source: 'ICAR-NBSS&LUP',
    top_crops: []
  };

  // State historical records across all years
  const stateYearHistory = Object.entries(data.state_yearly)
    .map(([year, states]) => ({
      year,
      production: states[activeState]?.production || 0,
      yieldVal: states[activeState]?.yield || 0,
      rainfall: states[activeState]?.rainfall || 0,
    }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  const totalProd = stateYearHistory.reduce((acc, curr) => acc + curr.production, 0);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* State Selection Bar */}
      <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <MapPin size={20} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              STATE DRILLDOWN & TAXONOMY
            </div>
            <div className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>{activeState}</span>
              <span className="text-xs font-normal font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {sp.zone}
              </span>
            </div>
          </div>
        </div>

        {/* State Dropdown Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">SELECT REGION:</span>
          <select
            value={activeState}
            onChange={e => {
              setActiveState(e.target.value);
              if (onSelectState) onSelectState(e.target.value);
            }}
            className="bg-slate-900 border border-slate-700 text-cyan-400 text-xs font-bold font-mono rounded-xl px-4 py-2 focus:outline-none focus:border-cyan-400"
          >
            {allStates.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* State Agro-Climatic Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Soil Profiles (ICAR-NBSS&LUP) */}
        <div className="glass-panel p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            DOMINANT SOIL TAXONOMY (ICAR-NBSS&LUP)
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {sp.soils.map(soil => (
              <span
                key={soil}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold"
              >
                🌱 {soil}
              </span>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            Source: {sp.source}
          </div>
        </div>

        {/* Card 2: Climate Profile */}
        <div className="glass-panel p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 flex items-center gap-1.5">
            <Droplets size={14} className="text-cyan-400" />
            CLIMATIC DYNAMICS & RAINFALL
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-2">{sp.climate_desc}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              ☀️ Season: {sp.primary_season}
            </span>
          </div>
        </div>

        {/* Card 3: Cumulative Production */}
        <div className="glass-panel p-5 bg-gradient-to-br from-slate-900 to-cyan-950/40">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">
            CUMULATIVE OUTPUT (1997-2020)
          </div>
          <div className="text-3xl font-black font-mono text-cyan-400 mb-2">
            {formatLargeNumber(totalProd)}
          </div>
          <div className="text-xs text-slate-400">
            Leading crop share dominates regional agricultural GDP.
          </div>
        </div>
      </div>

      {/* State Charts: Top Crops Bar & Historical Production Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Crops in State */}
        <div className="glass-panel p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
            TOP CULTIVATED CROPS IN {activeState.toUpperCase()}
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sp.top_crops} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="crop" stroke="#64748B" fontSize={10} tickLine={false} interval={0} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} tickFormatter={formatLargeNumber} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-cyan-500/40 p-2 rounded-lg text-xs font-mono">
                          <div className="font-bold text-white">{payload[0].payload.crop}</div>
                          <div className="text-cyan-400">{formatLargeNumber(payload[0].value)} units</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="production" fill="#00E5FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Production Trend in State */}
        <div className="glass-panel p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
            HISTORICAL OUTPUT TRAJECTORY (1997–2020)
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stateYearHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="year" stroke="#64748B" fontSize={10} tickLine={false} interval={3} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} tickFormatter={formatLargeNumber} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-emerald-500/40 p-2 rounded-lg text-xs font-mono">
                          <div className="text-slate-400">Year {payload[0].payload.year}</div>
                          <div className="text-emerald-400 font-bold">{formatLargeNumber(payload[0].value)} units</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="production" stroke="#00E676" strokeWidth={2.5} dot={{ r: 2, fill: '#00E676' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
