import React from 'react';
import {
  Radar, Database, Sparkles, Download, Layers, PlayCircle,
  ChevronDown, BarChart3, Radio
} from 'lucide-react';

export default function Navbar({
  datasets,
  activeDatasetId,
  onSelectDataset,
  onOpenScraper,
  onLoadSample,
  onOpenExport,
  loadingSample,
  activeTab,
  setActiveTab,
  currencyCode,
  onSelectCurrency
}) {
  const currentDataset = datasets.find(d => d.id === activeDatasetId);

  const navItems = [
    { id: 'explorer', label: 'Explorer', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'scraper', label: 'Scraper', icon: Radio },
    { id: 'datasets', label: `Datasets (${datasets.length})`, icon: Database },
  ];

  return (
    <header className="relative z-40 w-full px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-2 pointer-events-none">
      <div className="pointer-events-auto max-w-7xl mx-auto bg-[#0d1424]/95 backdrop-blur-xl border border-white/30 shadow-[0_0_35px_rgba(255,255,255,0.22),0_15px_35px_rgba(0,0,0,0.7)] ring-1 ring-white/20 rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2.5 transition-all">
        
        {/* Main Row: 3-Zone Architecture (Left: Brand | Center: Tabs | Right: Actions) */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          
          {/* 1. Left Zone: Brand Logo & Title with Live Radar Animation */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
            onClick={() => setActiveTab('explorer')}
            title="GigRadar Dashboard"
          >
            <div className="relative flex-shrink-0">
              {/* Ambient Emerald Pulse Aura */}
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-40 blur-sm group-hover:opacity-80 transition-opacity duration-300 animate-pulse" />
              
              {/* Outer Gradient Frame */}
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-md shadow-emerald-500/25 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center">
                <div className="h-full w-full bg-[#0d131f] rounded-[10.5px] flex items-center justify-center overflow-hidden">
                  {/* Rotating Radar Antenna (faster on hover) */}
                  <Radar className="h-4.5 w-4.5 text-emerald-400 animate-[spin_6s_linear_infinite] group-hover:animate-[spin_2s_linear_infinite] transition-all" />
                </div>
              </div>

              {/* Active Radar Beacon Ping */}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-[#0d1424]" />
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold tracking-tight text-white text-base group-hover:text-emerald-300 transition-colors">
                  GigRadar
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 leading-none">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-normal mt-0.5 leading-none select-none">
                by <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-bold tracking-wide">Bilal Iqbal</span>
              </span>
            </div>
          </div>

          {/* 2. Center Zone: Navigation Tabs (Desktop lg+) */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-2">
            <nav className="flex items-center gap-1 bg-slate-900/90 border border-white/5 p-1 rounded-xl shadow-inner h-9">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 3. Right Zone: Actions (Strictly Uniform h-9 Height & Perfect Optical Baseline) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            
            {/* Currency Selector */}
            <div className="relative flex-shrink-0">
              <select
                value={currencyCode || 'USD'}
                onChange={(e) => onSelectCurrency(e.target.value)}
                className="appearance-none h-9 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-emerald-400 font-bold text-xs pl-2.5 pr-6 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer transition-all shadow-sm leading-none"
                title="Change display currency"
              >
                <option value="USD">USD ($)</option>
                <option value="PKR">PKR (₨)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Active Dataset Dropdown */}
            <div className="relative flex-shrink-0 hidden md:block">
              <select
                value={activeDatasetId || ''}
                onChange={(e) => onSelectDataset(e.target.value)}
                className="appearance-none h-9 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 text-xs font-medium pl-3 pr-7 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer max-w-[140px] xl:max-w-[180px] truncate transition-all shadow-sm leading-none"
                title="Switch active dataset"
              >
                {datasets.map(d => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">
                    {d.title} ({d.itemCount || 0})
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Demo Benchmark button */}
            <button
              onClick={() => onLoadSample('logo')}
              disabled={loadingSample}
              title="Load built-in 48-gig sample benchmark dataset"
              className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 hover:border-amber-400/40 transition-all active:scale-95 shadow-sm"
            >
              <Sparkles className={`h-3.5 w-3.5 text-amber-400 ${loadingSample ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline">Demo</span>
            </button>

            {/* Export button */}
            <button
              onClick={onOpenExport}
              disabled={!currentDataset}
              title="Export dataset as CSV, JSON, or Markdown"
              className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 hover:border-emerald-500/40 transition-all disabled:opacity-40 active:scale-95 shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Export</span>
            </button>

            {/* New Scrape CTA Button */}
            <button
              onClick={() => {
                setActiveTab('scraper');
                if (onOpenScraper) onOpenScraper();
              }}
              title="Start a new live search scrape"
              className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all transform active:scale-95 whitespace-nowrap"
            >
              <PlayCircle className="h-4 w-4 fill-slate-950/20" />
              <span>New Scrape</span>
            </button>

          </div>

        </div>

        {/* Sub-row Navigation for Tablet / Mobile (visible below lg) */}
        <div className="flex lg:hidden items-center justify-between gap-1 pt-2.5 mt-2.5 border-t border-white/5 overflow-x-auto no-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 flex-1 justify-center whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
