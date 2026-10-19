import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import SpatialMapView from './components/SpatialMapView';
import StateExplorerView from './components/StateExplorerView';
import CropIntelligenceView from './components/CropIntelligenceView';
import DataTableView from './components/DataTableView';
import agriData from './data/agri_data.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeYear, setActiveYear] = useState('All');
  const [theme, setTheme] = useState('dark');
  const [selectedState, setSelectedState] = useState('Punjab');
  const [selectedCrop, setSelectedCrop] = useState('Wheat');

  // Handle theme body class updates
  useEffect(() => {
    document.documentElement.className = theme;
    if (theme === 'dark') {
      document.body.style.backgroundColor = '#070D18';
      document.body.style.color = '#F8FAFC';
    } else if (theme === 'slate') {
      document.body.style.backgroundColor = '#1E2538';
      document.body.style.color = '#F1F5F9';
    } else {
      document.body.style.backgroundColor = '#F1F5F9';
      document.body.style.color = '#0F172A';
    }
  }, [theme]);

  const handleStateDrilldown = (stateName) => {
    setSelectedState(stateName);
    setActiveTab('state');
  };

  const handleCropDrilldown = (cropName) => {
    setSelectedCrop(cropName);
    setActiveTab('crop');
  };

  return (
    <div className={`min-h-screen p-4 md:p-7 max-w-[1600px] mx-auto transition-colors duration-300 font-sans`}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeYear={activeYear}
        setActiveYear={setActiveYear}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Views */}
      <main className="w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            data={agriData}
            activeYear={activeYear}
            onSelectState={handleStateDrilldown}
            onSelectCrop={handleCropDrilldown}
          />
        )}

        {activeTab === 'map' && (
          <SpatialMapView
            data={agriData}
            onSelectState={handleStateDrilldown}
          />
        )}

        {activeTab === 'state' && (
          <StateExplorerView
            data={agriData}
            selectedState={selectedState}
            onSelectState={setSelectedState}
          />
        )}

        {activeTab === 'crop' && (
          <CropIntelligenceView
            data={agriData}
            selectedCrop={selectedCrop}
            onSelectCrop={setSelectedCrop}
          />
        )}

        {activeTab === 'data' && (
          <DataTableView
            data={agriData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs font-mono text-slate-500 pb-6 border-t border-slate-800/60 pt-4 flex flex-wrap justify-between items-center gap-2">
        <span>🌾 AGRI-INTELLIGENCE // HISTORICAL RESEARCH COMMAND CENTER</span>
        <span>BENCHMARKS: ICAR • NBSS&LUP • DES • TNAU • FAO</span>
        <span className="text-cyan-400">STATUS: PRODUCTION LIVE 60 FPS</span>
      </footer>
    </div>
  );
}
