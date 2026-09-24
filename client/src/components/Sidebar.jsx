import React, { useState } from 'react';
import {
  Search, BarChart3, Radio, Database, Monitor, Plus,
  ChevronDown, Layers, Menu, X, Sparkles, Download, Check,
  PanelLeftClose, FileCode
} from 'lucide-react';
import { getRawExportUrl } from '../services/api';

export default function Sidebar({
  datasets,
  activeDatasetId,
  onSelectDataset,
  onOpenScraper,
  onLoadSample,
  loadingSample,
  activeTab,
  setActiveTab,
  currencyCode,
  onSelectCurrency,
  onOpenExport,
  isCollapsed,
  onToggleCollapse
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentDataset = datasets.find(d => d.id === activeDatasetId);

  const navItems = [
    { id: 'explorer', label: 'Explorer', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'scraper', label: 'Scraper', icon: Radio },
    { id: 'datasets', label: `Datasets (${datasets.length})`, icon: Database },
    { id: 'demo', label: 'Demo', icon: Monitor, isAction: true },
  ];

  const handleNavClick = (item) => {
    if (item.isAction) {
      onLoadSample('logo');
    } else {
      setActiveTab(item.id);
    }
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-5 px-4 select-none">
      
      {/* Top Brand Logo */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div
            onClick={() => { setActiveTab('explorer'); setIsMobileOpen(false); }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Target/Radar Target Icon matching screenshot */}
            <div className="relative h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_22px_rgba(16,185,129,0.6)] transition-all flex-shrink-0">
              {/* Outer Target Ring with Crosshairs */}
              <div className="h-6 w-6 rounded-full border-2 border-emerald-400 flex items-center justify-center relative">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-1 bg-emerald-400" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-1 bg-emerald-400" />
                <span className="absolute top-1/2 -left-1 -translate-y-1/2 h-0.5 w-1 bg-emerald-400" />
                <span className="absolute top-1/2 -right-1 -translate-y-1/2 h-0.5 w-1 bg-emerald-400" />
              </div>
              {/* Pulsing beacon */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  GigRadar
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1 leading-none">
                by <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-bold">Bilal Iqbal</span>
              </span>
            </div>
          </div>

          {/* Desktop Collapse / Hide Navbar Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
              title="Hide Navbar (Collapse sidebar)"
            >
              <PanelLeftClose className="h-4 w-4 text-slate-400 hover:text-emerald-400" />
            </button>
          )}
        </div>

        {/* Navigation Items (Vertical matching screenshot) */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                disabled={item.id === 'demo' && loadingSample}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.id === 'demo' && loadingSample && (
                  <span className="ml-auto text-[10px] text-emerald-400 animate-pulse">Loading...</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Utilities & Big Glowing + New Scrape CTA */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        
        {/* Currency & Dataset Selectors in Sidebar */}
        <div className="space-y-2">
          {/* Active Dataset Dropdown */}
          <div className="relative">
            <select
              value={activeDatasetId || ''}
              onChange={(e) => onSelectDataset(e.target.value)}
              className="w-full appearance-none bg-[#0e1422] border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-medium pl-3 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer truncate"
              title={currentDataset ? currentDataset.title : 'Select dataset'}
            >
              {datasets.length === 0 && <option value="">No datasets found</option>}
              {datasets.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title || d.query} ({d.itemCount} gigs)
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Currency Switcher & Export */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={currencyCode || 'USD'}
                onChange={(e) => onSelectCurrency(e.target.value)}
                className="w-full appearance-none bg-[#0e1422] border border-slate-800 hover:border-emerald-500/40 text-emerald-400 font-bold text-[11px] pl-3 pr-6 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer transition-colors"
                title="Change display currency"
              >
                <option value="USD">USD ($)</option>
                <option value="PKR">PKR (₨)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <ChevronDown className="h-3 w-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {activeDatasetId && (
              <a
                href={getRawExportUrl(activeDatasetId)}
                download
                className="p-1.5 rounded-xl bg-[#0e1422] hover:bg-emerald-950/80 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/40 text-slate-400 transition-colors"
                title="Download 100% Pure Raw Scraped JSON (Untouched)"
              >
                <FileCode className="h-3.5 w-3.5" />
              </a>
            )}

            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                className="p-1.5 rounded-xl bg-[#0e1422] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Export current dataset"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Big Glowing Emerald CTA: + New Scrape */}
        <button
          type="button"
          onClick={() => {
            onOpenScraper();
            setIsMobileOpen(false);
          }}
          className="w-full relative group overflow-hidden rounded-2xl bg-[#00f59b] hover:bg-emerald-400 text-slate-950 font-extrabold text-sm py-3 px-4 shadow-[0_0_25px_rgba(0,245,155,0.45)] hover:shadow-[0_0_35px_rgba(0,245,155,0.7)] flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {/* Ambient Glow Aura */}
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>New Scrape</span>
        </button>

      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sticky/Fixed Left Sidebar */}
      <aside className={`hidden md:flex flex-col w-56 xl:w-60 h-screen fixed left-0 top-0 bottom-0 bg-[#090d15] border-r border-white/5 z-30 transition-transform duration-300 ease-in-out ${
        isCollapsed ? '-translate-x-full pointer-events-none' : 'translate-x-0'
      }`}>
        {sidebarContent}
      </aside>

      {/* Mobile Top Navbar Bar with Hamburger */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#090d15] border-b border-white/5">
        <div
          onClick={() => setActiveTab('explorer')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-emerald-400 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>
          <span className="text-base font-black text-white">GigRadar</span>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex">
          <div className="w-64 h-full bg-[#090d15] border-r border-white/10 shadow-2xl">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
