import React from 'react';
import {
  X, Star, Clock, Check, ExternalLink, ShieldCheck,
  Award, Zap, DollarSign, Sparkles
} from 'lucide-react';
import { formatPrice } from '../services/currency';

export default function ComparisonMatrix({ gigs, onClose, onRemoveGig, onInspectGig, currencyCode = 'USD' }) {
  if (!gigs || gigs.length === 0) return null;

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/85 backdrop-blur-md overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-[#0d131f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col cursor-default"
      >
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Competitive Comparison Matrix</h2>
              <p className="text-xs text-slate-400">Side-by-side comparison of {gigs.length} selected Fiverr gigs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Matrix Table */}
        <div className="p-6 overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 px-4 w-48 text-slate-400 font-bold uppercase text-[11px]">Feature / Metric</th>
                {gigs.map(g => (
                  <th key={g.id || g.url} className="py-4 px-4 min-w-[220px] max-w-[260px] align-top">
                    <div className="space-y-2 relative">
                      <button
                        onClick={() => onRemoveGig(g)}
                        title="Remove from comparison"
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <img
                        src={g.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                        alt=""
                        className="h-28 w-full object-cover rounded-xl border border-white/10"
                      />
                      <h4 className="font-bold text-white line-clamp-2 leading-snug">{g.title}</h4>
                      <p className="text-slate-400 text-[11px] font-medium">by {g.seller_displayName || g.seller_username}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 text-slate-200">
              {/* Starting Price */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400 bg-slate-900/30">Starting Price</td>
                {gigs.map(g => (
                  <td key={g.id} className="py-3 px-4 font-mono text-base font-black text-emerald-400">
                    {formatPrice(g.starting_price, currencyCode)}
                  </td>
                ))}
              </tr>

              {/* Rating & Reviews */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400 bg-slate-900/30">Rating & Volume</td>
                {gigs.map(g => (
                  <td key={g.id} className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-white">{Number(g.seller_rating_score || g.buying_rating || 5).toFixed(1)}</span>
                      <span className="text-slate-500">({g.buying_review_count || g.seller_rating_count || 0})</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Delivery Speed */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400 bg-slate-900/30">Turnaround Speed</td>
                {gigs.map(g => (
                  <td key={g.id} className="py-3 px-4 flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{g.delivery_days ? `${g.delivery_days} Days` : 'Standard'}</span>
                  </td>
                ))}
              </tr>

              {/* Seller Level */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400 bg-slate-900/30">Seller Level</td>
                {gigs.map(g => (
                  <td key={g.id} className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/5 text-[11px] font-semibold text-slate-300">
                      {g.seller_level || 'New Seller'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Country */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400 bg-slate-900/30">Country</td>
                {gigs.map(g => (
                  <td key={g.id} className="py-3 px-4 font-mono">
                    {g.seller_country || 'Global'}
                  </td>
                ))}
              </tr>

              {/* Badges */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400 bg-slate-900/30">Badges & Flags</td>
                {gigs.map(g => (
                  <td key={g.id} className="py-3 px-4 space-y-1">
                    {g.isFiverrChoice && (
                      <span className="inline-block px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold mr-1">
                        Fiverr's Choice
                      </span>
                    )}
                    {g.is_promoted && (
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        Sponsored Ad
                      </span>
                    )}
                    {!g.isFiverrChoice && !g.is_promoted && (
                      <span className="text-slate-500 text-xs">Organic Listing</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Packages available */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400 bg-slate-900/30">Package Tiers</td>
                {gigs.map(g => (
                  <td key={g.id} className="py-3 px-4">
                    {g.packages && g.packages.length > 0 ? (
                      <span className="text-emerald-400 font-bold">{g.packages.length} Tiers Configured</span>
                    ) : (
                      <span className="text-slate-500">1 Tier</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Action Buttons */}
              <tr>
                <td className="py-4 px-4 font-bold text-slate-400 bg-slate-900/30">Actions</td>
                {gigs.map(g => (
                  <td key={g.id} className="py-4 px-4 space-y-2">
                    <button
                      onClick={() => {
                        onClose();
                        onInspectGig(g);
                      }}
                      className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
                    >
                      Inspect Dossier
                    </button>
                    {g.url && (
                      <a
                        href={g.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1 transition-all"
                      >
                        <span>Open on Fiverr</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
