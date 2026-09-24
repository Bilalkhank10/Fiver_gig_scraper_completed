import React from 'react';
import {
  Database, Calendar, Tag, Trash2, ArrowRight, Download,
  Sparkles, Layers, CheckCircle2, Clock, FileCode
} from 'lucide-react';
import { getExportUrl, getRawExportUrl } from '../services/api';

export default function DatasetManager({
  datasets,
  activeDatasetId,
  onSelectDataset,
  onDeleteDataset,
  onLoadSample,
  loadingSample
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dataset Archive & Storage</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your historical scrape runs, benchmark datasets, and export structured intelligence.
          </p>
        </div>

        {/* Quick Seed Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => onLoadSample('logo')}
            disabled={loadingSample}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 hover:border-emerald-500/40 transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Load Logo Design Benchmark</span>
          </button>
          <button
            onClick={() => onLoadSample('web')}
            disabled={loadingSample}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 hover:border-emerald-500/40 transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>Load Web & AI Dataset</span>
          </button>
        </div>
      </div>

      {/* Datasets Grid */}
      {datasets.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-white/10 space-y-4">
          <Database className="h-12 w-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-slate-300">No Datasets Saved Yet</h4>
          <p className="text-xs text-slate-400">
            Launch a scrape in the Scraper Hub or load one of our verified benchmarks above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map(ds => {
            const isActive = ds.id === activeDatasetId;
            const stats = ds.stats || {};
            const dateStr = new Date(ds.createdAt).toLocaleDateString();
            const timeStr = new Date(ds.createdAt).toLocaleTimeString();

            return (
              <div
                key={ds.id}
                className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                  isActive
                    ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 bg-slate-900/90'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        {isActive && (
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono">
                          {ds.scrapeMode || 'SEARCH'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">{ds.title}</h4>
                      <p className="text-xs text-slate-400 font-mono">Query: "{ds.query || 'n/a'}"</p>
                    </div>

                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-white/5">
                      {ds.itemCount} Gigs
                    </span>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/70 p-2.5 rounded-xl border border-white/5 text-center">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Avg Price</span>
                      <strong className="text-xs font-mono font-bold text-emerald-400">${stats.avgPrice || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Median</span>
                      <strong className="text-xs font-mono font-bold text-slate-200">${stats.medianPrice || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Ads</span>
                      <strong className="text-xs font-mono font-bold text-amber-400">{stats.promotedPercent || 0}%</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Saved on {dateStr} at {timeStr}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    {/* Direct 100% Pure Raw Scraped JSON Download */}
                    <a
                      href={getRawExportUrl(ds.id)}
                      download
                      title="Download 100% Pure Raw Scraped JSON (Untouched, no math functions)"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-950/80 hover:text-emerald-300 text-slate-300 transition-colors"
                    >
                      <FileCode className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={getExportUrl(ds.id, 'csv')}
                      download
                      title="Download CSV"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => onDeleteDataset(ds.id)}
                      title="Delete Dataset"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/80 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectDataset(ds.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    <span>{isActive ? 'Active' : 'Load Dataset'}</span>
                    {!isActive && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
