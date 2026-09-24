import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Square, Terminal, Settings2, Sparkles, Filter,
  Layers, CheckCircle2, AlertTriangle, Info, XCircle, ArrowRight,
  RefreshCw, Globe, Shield, Hash, FastForward, Radar, Activity,
  Search, Sliders, ChevronDown, Check, Zap, Link2, ExternalLink
} from 'lucide-react';
import { startScrape, stopScrape, subscribeScrapeStream } from '../services/api';

export default function ScraperHub({ onScrapeComplete, onSwitchToExplorer }) {
  // Form State
  const [scrapeMode, setScrapeMode] = useState('search'); // 'search' | 'search_details' | 'details'
  const [query, setQuery] = useState('logo design');
  const [searchUrl, setSearchUrl] = useState('');
  const [gigUrls, setGigUrls] = useState('');
  const [maxPages, setMaxPages] = useState(1);
  const [sortBy, setSortBy] = useState('auto');
  const [skipPromoted, setSkipPromoted] = useState(false);
  const [dedupeGigs, setDedupeGigs] = useState(true);
  const [maxItems, setMaxItems] = useState(48);
  const [fetchVia, setFetchVia] = useState('auto');
  const [jinaApiKey, setJinaApiKey] = useState('');
  const [mockMode, setMockMode] = useState(false);

  // Execution State
  const [isScraping, setIsScraping] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [progress, setProgress] = useState({ page: 0, totalPages: 1, itemsScraped: 0, percent: 0 });
  const [logs, setLogs] = useState([]);
  const [scrapedItems, setScrapedItems] = useState([]);
  const [finishedResult, setFinishedResult] = useState(null);
  const [streamView, setStreamView] = useState('radar'); // 'radar' | 'logs'

  const terminalEndRef = useRef(null);
  const streamUnsubRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Clean up SSE connection on unmount
  useEffect(() => {
    return () => {
      if (streamUnsubRef.current) {
        streamUnsubRef.current();
        streamUnsubRef.current = null;
      }
    };
  }, []);

  const handleStartScrape = async () => {
    if (streamUnsubRef.current) {
      streamUnsubRef.current();
      streamUnsubRef.current = null;
    }

    setIsScraping(true);
    setFinishedResult(null);
    setLogs([]);
    setScrapedItems([]);
    setProgress({ page: 0, totalPages: maxPages, itemsScraped: 0, percent: 5 });

    try {
      const payload = {
        scrapeMode,
        query: query.trim(),
        searchUrl: searchUrl.trim() || null,
        gigUrls: gigUrls.split('\n').map(u => u.trim()).filter(Boolean),
        maxPages: Number(maxPages) || 1,
        sortBy,
        skipPromoted,
        dedupeGigs,
        maxItems: Number(maxItems) || 0,
        fetchVia,
        jinaApiKey: jinaApiKey.trim() || undefined,
        mockMode
      };

      const res = await startScrape(payload);
      if (!res.success) throw new Error(res.error || 'Failed to start job');

      const jobId = res.jobId;
      setCurrentJobId(jobId);

      // Subscribe to real-time events via SSE
      streamUnsubRef.current = subscribeScrapeStream(jobId, {
        onLog: (log) => {
          setLogs(prev => [...prev.slice(-399), log]);
        },
        onProgress: (prog) => {
          setProgress(prog);
        },
        onItem: (item) => {
          setScrapedItems(prev => [item, ...prev.slice(0, 99)]);
        },
        onDone: (result) => {
          setIsScraping(false);
          setFinishedResult(result);
          setProgress(p => ({ ...p, percent: 100 }));
          if (streamUnsubRef.current) {
            streamUnsubRef.current();
            streamUnsubRef.current = null;
          }
          if (onScrapeComplete) onScrapeComplete(result.datasetId);
        },
        onError: (err) => {
          setIsScraping(false);
          if (streamUnsubRef.current) {
            streamUnsubRef.current();
            streamUnsubRef.current = null;
          }
          setLogs(prev => [
            ...prev,
            { id: 'err_' + Date.now(), timestamp: new Date().toISOString(), level: 'error', message: err.message || 'Scrape connection error' }
          ]);
        }
      });

    } catch (err) {
      setIsScraping(false);
      setLogs(prev => [
        ...prev,
        { id: 'err_' + Date.now(), timestamp: new Date().toISOString(), level: 'error', message: err.message }
      ]);
    }
  };

  const handleStopScrape = async () => {
    if (!currentJobId) return;
    try {
      await stopScrape(currentJobId);
      setIsScraping(false);
    } catch (err) {
      console.error(err);
    }
  };

  const quickKeywords = [
    'Logo Design', 'WordPress', 'AI Chatbot', 'Shopify Store',
    'Video Editing', 'SEO Specialist', 'Mobile App', 'Voice Over'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Sleek Floating Header Hero */}
      <div className="bg-[#0d1424]/90 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Live Intercept Engine • v1.2
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            Fiverr Market Intelligence Scraper
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Extract live search rankings, sponsored ad telemetry, 3-tier gig packages, buyer testimonials, and seller dossiers with real-time SSE streaming.
          </p>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setMockMode(!mockMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 shadow-sm ${
              mockMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'
                : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 text-amber-400 ${mockMode ? 'animate-spin' : ''}`} />
            <span>Demo Benchmark: {mockMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Grid: Left (Parameters) | Right (Telemetry Deck) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Scraper Configuration (5 cols) */}
        <div className="lg:col-span-5 bg-[#0d1424]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-5">
          
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Settings2 className="h-4 w-4 text-emerald-400" />
              <span>Target Parameters</span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Pure HTTP
            </span>
          </div>

          {/* Scrape Mode Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Scrape Mode</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setScrapeMode('search')}
                className={`py-2 px-1 rounded-lg transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  scrapeMode === 'search'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">Search</span>
              </button>
              <button
                type="button"
                onClick={() => setScrapeMode('search_details')}
                className={`py-2 px-1 rounded-lg transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  scrapeMode === 'search_details'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">Deep Crawl</span>
              </button>
              <button
                type="button"
                onClick={() => setScrapeMode('details')}
                className={`py-2 px-1 rounded-lg transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  scrapeMode === 'details'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">URL List</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {scrapeMode === 'search' && '⚡ Extracts 48 gigs per search page instantly with organic/ad rankings.'}
              {scrapeMode === 'search_details' && '🔍 Scrapes search SERP, then opens each gig for 3 packages, reviews & seller info.'}
              {scrapeMode === 'details' && '🔗 Directly inspects a list of specific Fiverr gig URLs.'}
            </p>
          </div>

          {/* Primary Target Input */}
          {scrapeMode !== 'details' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Search Query Keyword
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. logo design, wordpress, ai chatbot"
                    className="w-full bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Keyword Presets */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Trending Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickKeywords.map(kw => {
                    const isActive = query.toLowerCase() === kw.toLowerCase();
                    return (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => setQuery(kw.toLowerCase())}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-white/5'
                        }`}
                      >
                        {kw}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Category URL Override */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Optional Category URL (Override)
                </label>
                <input
                  type="url"
                  value={searchUrl}
                  onChange={(e) => setSearchUrl(e.target.value)}
                  placeholder="https://www.fiverr.com/categories/graphics-design/logo-design?..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Target Gig URLs (one per line)
              </label>
              <textarea
                rows={4}
                value={gigUrls}
                onChange={(e) => setGigUrls(e.target.value)}
                placeholder="https://www.fiverr.com/seller/gig-title..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          )}

          {/* Crawl Parameters (Max Pages & Sort Order) */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Max Pages</label>
                <span className="text-[11px] font-mono font-bold text-emerald-400">{maxPages} ({maxPages * 48} gigs)</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={maxPages}
                style={{
                  '--slider-fill': `${((maxPages - 1) / (5 - 1)) * 100}%`
                }}
                onChange={(e) => setMaxPages(Number(e.target.value))}
                className="premium-range-slider w-full cursor-pointer mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Sort Order</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-slate-900 border border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 rounded-xl pl-3 pr-7 py-2 text-xs text-slate-200 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="auto">Auto / Recommended</option>
                  <option value="rating">Highest Rating</option>
                  <option value="new">New Arrivals</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Engine Toggles */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
              <span className="text-xs text-slate-300 font-medium">Skip Sponsored / Promoted Ads</span>
              <input
                type="checkbox"
                checked={skipPromoted}
                onChange={(e) => setSkipPromoted(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-400 h-4 w-4 bg-slate-900 border-slate-700 accent-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
              <span className="text-xs text-slate-300 font-medium">Deduplicate Gigs by Unique ID</span>
              <input
                type="checkbox"
                checked={dedupeGigs}
                onChange={(e) => setDedupeGigs(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-400 h-4 w-4 bg-slate-900 border-slate-700 accent-emerald-500 cursor-pointer"
              />
            </label>

            <div className="flex items-center justify-between p-2">
              <span className="text-xs text-slate-300 font-medium">Bypass Route</span>
              <select
                value={fetchVia}
                onChange={(e) => setFetchVia(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
              >
                <option value="auto">Auto (Direct + Jina Fallback)</option>
                <option value="jina">Jina Reader (Zero-Proxy)</option>
                <option value="direct">Direct Pure HTTP</option>
              </select>
            </div>
          </div>

          {/* Launch Action CTA */}
          <div className="pt-2">
            {!isScraping ? (
              <button
                type="button"
                onClick={handleStartScrape}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>Launch Live Scrape</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopScrape}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all animate-pulse"
              >
                <Square className="h-4 w-4 fill-white" />
                <span>Stop Scraper Engine</span>
              </button>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Unified Quantum Telemetry Deck (7 cols) */}
        <div className="lg:col-span-7 bg-[#0d1424]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between">
          
          {/* Deck Top Header: Status, Progress, and HUD Toggle */}
          <div className="bg-[#0f1728] p-4 sm:p-5 border-b border-white/5 space-y-3.5">
            
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${
                  isScraping
                    ? 'bg-emerald-400 animate-ping'
                    : finishedResult
                      ? 'bg-teal-400'
                      : 'bg-slate-500'
                }`} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  {isScraping
                    ? 'INTERCEPTING LIVE SERP...'
                    : finishedResult
                      ? 'MISSION ACCOMPLISHED'
                      : 'RADAR STANDBY • READY'}
                </span>
              </div>

              {/* View Switcher: Radar HUD (Default) vs Raw Logs */}
              <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-white/10 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setStreamView('radar')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    streamView === 'radar'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radar className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Radar HUD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStreamView('logs')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    streamView === 'logs'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Raw Logs ({logs.length})</span>
                </button>
              </div>
            </div>

            {/* Progress Bar Track */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Stream Telemetry</span>
                <span className="text-emerald-400 font-bold">{progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(3, progress.percent))}%` }}
                />
              </div>
            </div>

            {/* 3 Unified Telemetry Counters */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">SERP Page</span>
                <p className="text-base font-black text-white font-mono mt-0.5">
                  {progress.page} / {progress.totalPages || maxPages}
                </p>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Gigs Intercepted</span>
                <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                  {scrapedItems.length || progress.itemsScraped || 0}
                </p>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Engine Protocol</span>
                <p className="text-xs font-bold text-teal-300 mt-1 uppercase font-mono">
                  {mockMode ? 'Demo Benchmark' : fetchVia}
                </p>
              </div>
            </div>

            {/* Finished Alert with Direct Jump to Explorer */}
            {finishedResult && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-200">Dataset Saved Successfully</h4>
                    <p className="text-[11px] text-slate-300">
                      Captured {finishedResult.totalScraped} gigs with complete packages & ratings.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSwitchToExplorer}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 whitespace-nowrap flex-shrink-0"
                >
                  <span>Explore Gigs</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

          </div>

          {/* Main Deck Body: Animated Radar HUD vs Terminal Logs */}
          {streamView === 'radar' ? (
            /* SCI-FI ANIMATED RADAR SCOPE HUD */
            <div className="relative h-[340px] sm:h-[370px] bg-[#070b14] overflow-hidden flex flex-col justify-between p-4 select-none">
              
              {/* Radial Radar Ambient Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,transparent_75%)] pointer-events-none" />

              {/* The Radar Circle HUD */}
              <div className="relative flex-1 flex items-center justify-center my-1">
                <div className="relative w-56 h-56 sm:w-68 sm:h-68 rounded-full border border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.12)]">
                  
                  {/* Outer Dashed Azimuth Ring */}
                  <div className="absolute inset-0 rounded-full border border-emerald-500/20 border-dashed" />
                  
                  {/* Concentric Range Rings */}
                  <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-emerald-500/20" />
                  <div className="absolute w-30 h-30 sm:w-36 sm:h-36 rounded-full border border-emerald-500/25" />
                  <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-emerald-500/30" />

                  {/* 4 Coordinate Crosshairs */}
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-emerald-500/20" />
                  <div className="absolute inset-y-0 left-1/2 w-[1px] bg-emerald-500/20" />

                  {/* Polar Coordinates */}
                  <span className="absolute top-1 text-[8px] font-mono text-emerald-400/50">000°</span>
                  <span className="absolute right-1.5 text-[8px] font-mono text-emerald-400/50">090°</span>
                  <span className="absolute bottom-1 text-[8px] font-mono text-emerald-400/50">180°</span>
                  <span className="absolute left-1.5 text-[8px] font-mono text-emerald-400/50">270°</span>

                  {/* Rotating Conical Radar Sweep Beam */}
                  <div
                    className={`absolute inset-0 rounded-full pointer-events-none ${
                      isScraping ? 'animate-[spin_2.5s_linear_infinite]' : 'animate-[spin_7s_linear_infinite]'
                    }`}
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16,185,129,0.06) 320deg, rgba(16,185,129,0.45) 360deg)'
                    }}
                  />

                  {/* Sonar Pulsing Ping Waves during active scan */}
                  {isScraping && (
                    <>
                      <div className="absolute w-24 h-24 rounded-full border-2 border-emerald-400/60 animate-ping" />
                      <div className="absolute w-44 h-44 rounded-full border border-emerald-400/30 animate-ping delay-300" />
                    </>
                  )}

                  {/* Dynamic Target Blips positioned on scope */}
                  {isScraping && (
                    <>
                      <div className="absolute top-[26%] left-[34%] flex items-center justify-center pointer-events-none">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="absolute h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                      </div>
                      <div className="absolute top-[68%] left-[72%] flex items-center justify-center pointer-events-none">
                        <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-ping delay-200" />
                        <span className="absolute h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf]" />
                      </div>
                      <div className="absolute top-[38%] right-[22%] flex items-center justify-center pointer-events-none">
                        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping delay-500" />
                        <span className="absolute h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                      </div>
                    </>
                  )}

                  {/* Central Radar Core HUD */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/30 shadow-lg px-3.5 py-2">
                    <Radar className={`h-5 w-5 text-emerald-400 mb-0.5 ${isScraping ? 'animate-spin text-emerald-300' : 'animate-pulse'}`} />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                      {isScraping ? 'SCANNING ACTIVE' : finishedResult ? 'TARGET ACQUIRED' : 'RADAR STANDBY'}
                    </span>
                    <span className="text-xs font-bold text-white tracking-tight mt-0.5 max-w-[130px] truncate">
                      "{query}"
                    </span>
                    {isScraping && (
                      <span className="text-[9px] text-emerald-400 font-mono font-bold mt-0.5 animate-pulse">
                        {scrapedItems.length || progress.itemsScraped || 0} Gigs Intercepted
                      </span>
                    )}
                  </div>

                </div>
              </div>

              {/* Bottom Live Intercept Feed Ticker */}
              <div className="relative z-10 bg-slate-950/90 border border-white/10 rounded-xl p-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
                    <span className="font-bold text-slate-200 uppercase tracking-wider">Live Intercept Feed</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{progress.percent}% Telemetry</span>
                </div>

                {/* Gigs Sliding Carousel */}
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
                  {scrapedItems.length > 0 ? (
                    scrapedItems.slice(0, 4).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex-shrink-0 flex items-center space-x-2 bg-slate-900/95 border border-emerald-500/30 px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          #{item.position || idx + 1}
                        </span>
                        <span className="text-xs text-white font-medium truncate max-w-[140px]">
                          {item.title}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          ${item.starting_price || item.price || '--'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center py-1 text-xs text-slate-500 font-mono">
                      {isScraping ? 'Intercepting incoming gig packets from Fiverr search engine...' : 'Press "Launch Live Scrape" to start interception radar.'}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* RAW DEVELOPER TERMINAL LOGS */
            <div className="p-4 h-[340px] sm:h-[370px] overflow-y-auto font-mono text-xs space-y-2 select-text bg-[#070b14]">
              <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[10px] text-slate-500">
                <span>EVENT STREAM LOGS</span>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="hover:text-slate-300 transition-colors"
                >
                  Clear Logs
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-16">
                  <Terminal className="h-8 w-8 text-slate-600 animate-pulse" />
                  <p>Ready to scrape. Launch a scrape to stream raw system logs.</p>
                </div>
              ) : (
                logs.map((entry, idx) => {
                  const time = new Date(entry.timestamp).toLocaleTimeString();
                  let colorClass = 'text-slate-300';
                  let icon = <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />;

                  if (entry.level === 'success') {
                    colorClass = 'text-emerald-300';
                    icon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />;
                  } else if (entry.level === 'warning') {
                    colorClass = 'text-amber-300';
                    icon = <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />;
                  } else if (entry.level === 'error') {
                    colorClass = 'text-red-400';
                    icon = <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />;
                  }

                  return (
                    <div key={entry.id || idx} className="flex items-start space-x-2 py-0.5 leading-relaxed">
                      <span className="text-slate-500 text-[10px]">{time}</span>
                      {icon}
                      <span className={`${colorClass} break-all`}>{entry.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
