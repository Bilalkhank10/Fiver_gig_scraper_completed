import React, { useState } from 'react';
import {
  X, Download, Copy, Check, FileSpreadsheet, FileJson,
  FileText, Sparkles, FileCode
} from 'lucide-react';
import { getExportUrl } from '../services/api';

export default function ExportModal({ dataset, onClose }) {
  if (!dataset) return null;

  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState('raw'); // 'raw' | 'csv' | 'json' | 'markdown'

  const items = dataset.items || [];
  const stats = dataset.stats || {};

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const generateMarkdownReport = () => {
    const lines = [
      `# Fiverr Market Intelligence Report: ${dataset.title}`,
      `*Generated on ${new Date().toLocaleDateString()} — Query: "${dataset.query}"*`,
      '',
      '## Market KPI Summary',
      `- **Total Gigs Analyzed:** ${stats.totalGigs || items.length}`,
      `- **Average Starting Price:** $${stats.avgPrice || 0}`,
      `- **Median Price:** $${stats.medianPrice || 0}`,
      `- **Promoted Ad Ratio:** ${stats.promotedPercent || 0}%`,
      `- **Average Turnaround:** ${stats.avgDeliveryDays || 0} Days`,
      '',
      '## Top Ranked Gigs Benchmark',
      '| Rank | Title | Seller | Rating | Price | Delivery | Promoted |',
      '|---|---|---|---|---|---|---|'
    ];

    items.slice(0, 15).forEach(i => {
      lines.push(
        `| #${i.position || '-'} | [${(i.title || '').slice(0, 40)}...](${i.url || '#'}) | ${i.seller_username || 'Seller'} | ${i.seller_rating_score || 5}★ (${i.buying_review_count || 0}) | $${i.starting_price || 0} | ${i.delivery_days || '-'}d | ${i.is_promoted ? 'YES' : 'NO'} |`
      );
    });

    return lines.join('\n');
  };

  const handleCopy = () => {
    let content = '';
    if (exportFormat === 'raw') {
      content = JSON.stringify(dataset.items || [], null, 2);
    } else if (exportFormat === 'json') {
      content = JSON.stringify(dataset, null, 2);
    } else if (exportFormat === 'markdown') {
      content = generateMarkdownReport();
    } else {
      const headers = ['ID', 'Title', 'Seller', 'Seller Country', 'Seller Level', 'Rating', 'Review Count', 'Starting Price ($)', 'Delivery Days', 'Is Promoted', 'Fiverr Choice', 'URL'];
      const rows = items.map(i => [
        i.id || '',
        `"${String(i.title || '').replace(/"/g, '""')}"`,
        `"${String(i.seller_username || i.seller_displayName || '').replace(/"/g, '""')}"`,
        i.seller_country || '',
        i.seller_level || '',
        i.seller_rating_score || i.buying_rating || '',
        i.buying_review_count || i.seller_rating_count || 0,
        i.starting_price != null ? i.starting_price : '',
        i.delivery_days || '',
        i.is_promoted ? 'YES' : 'NO',
        i.isFiverrChoice ? 'YES' : 'NO',
        `"${String(i.url || '').replace(/"/g, '""')}"`
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewContent = exportFormat === 'raw'
    ? JSON.stringify((dataset.items || []).slice(0, 1), null, 2)
    : exportFormat === 'markdown'
    ? generateMarkdownReport()
    : exportFormat === 'json'
    ? JSON.stringify(dataset.items.slice(0, 3), null, 2)
    : `ID,Title,Seller,Price,Rating,Delivery\n` +
      items.slice(0, 5).map(i => `${i.id},"${(i.title || '').slice(0, 30)}...",${i.seller_username},$${i.starting_price},${i.seller_rating_score}★,${i.delivery_days}d`).join('\n');

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0d131f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto cursor-default"
      >
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Dataset Intelligence</h3>
              <p className="text-xs text-slate-400">{dataset.title} ({items.length} records)</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Format Selection Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Select Export Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* 100% Pure Raw Scraped JSON */}
              <button
                type="button"
                onClick={() => setExportFormat('raw')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                  exportFormat === 'raw'
                    ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <FileCode className={`h-5 w-5 ${exportFormat === 'raw' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Pure Raw
                  </span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">100% Raw Data</h5>
                  <p className="text-[10px] text-slate-400">Untouched, zero math</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                  exportFormat === 'csv'
                    ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                }`}
              >
                <FileSpreadsheet className={`h-5 w-5 ${exportFormat === 'csv' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <h5 className="text-xs font-bold text-white">CSV Spreadsheet</h5>
                  <p className="text-[10px] text-slate-400">Excel, Sheets</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                  exportFormat === 'json'
                    ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                }`}
              >
                <FileJson className={`h-5 w-5 ${exportFormat === 'json' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <h5 className="text-xs font-bold text-white">Structured JSON</h5>
                  <p className="text-[10px] text-slate-400">With stats & KPIs</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('markdown')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                  exportFormat === 'markdown'
                    ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                }`}
              >
                <FileText className={`h-5 w-5 ${exportFormat === 'markdown' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <h5 className="text-xs font-bold text-white">Markdown Report</h5>
                  <p className="text-[10px] text-slate-400">Docs, Notion, GitHub</p>
                </div>
              </button>
            </div>
          </div>

          {/* Code Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">
                {exportFormat === 'raw' && '⚡ Untouched Raw Scraped JSON (Zero math functions, full 70+ fields)'}
                {exportFormat === 'csv' && 'CSV Preview'}
                {exportFormat === 'json' && 'Structured Intelligence JSON'}
                {exportFormat === 'markdown' && 'Markdown Intelligence Summary'}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-semibold"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>

            <div className="bg-[#070a10] border border-white/10 rounded-xl p-3 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre">
              {previewContent}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>

            {exportFormat !== 'markdown' ? (
              <a
                href={getExportUrl(dataset.id, exportFormat)}
                download
                className="px-5 py-2.5 rounded-xl bg-[#00f59b] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>Download {exportFormat === 'raw' ? '100% Pure Raw Scraped JSON' : `${exportFormat.toUpperCase()} File`}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={handleCopy}
                className="px-5 py-2.5 rounded-xl bg-[#00f59b] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Markdown Report</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
