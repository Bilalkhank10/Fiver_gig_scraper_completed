import React from 'react';
import {
  Star, Clock, Check, Zap, Award, Eye, Plus
} from 'lucide-react';
import { formatPrice } from '../services/currency';

export default function GigCard({ gig, onInspect, isSelected, onToggleSelect, currencyCode = 'USD' }) {
  const sellerLevelLabel = (lvl) => {
    if (!lvl) return 'New';
    if (lvl.includes('top_rated') || lvl === 'trs') return 'Top Rated';
    if (lvl.includes('two')) return 'Level 2';
    if (lvl.includes('one')) return 'Level 1';
    return 'New Seller';
  };

  const sellerLevelColor = (lvl) => {
    if (!lvl) return 'text-slate-400 bg-slate-800/80 border-slate-700/80';
    if (lvl.includes('top_rated') || lvl === 'trs') return 'text-amber-300 bg-amber-950/70 border-amber-500/50';
    if (lvl.includes('two')) return 'text-purple-300 bg-purple-950/70 border-purple-500/50';
    if (lvl.includes('one')) return 'text-blue-300 bg-blue-950/70 border-blue-500/50';
    return 'text-slate-400 bg-slate-800/80 border-slate-700/80';
  };

  const thumbnail = gig.thumbnail || (gig.gallery && gig.gallery[0]?.url) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
  const rating = gig.seller_rating_score || gig.buying_rating || 5.0;
  const price = gig.starting_price != null ? gig.starting_price : (gig.price_min || 0);

  // Approximate response time if not present
  const responseTime = gig.seller_responseTime || '1h';
  const deliveryDays = gig.delivery_days || 3;

  return (
    <div className={`group relative bg-[#0e1422] rounded-2xl overflow-hidden border flex flex-col justify-between transform transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.01] ${
      isSelected
        ? 'border-emerald-500 shadow-2xl shadow-emerald-500/25 ring-1 ring-emerald-500/40 bg-[#0f1728]'
        : 'border-slate-800/90 hover:border-emerald-500/60 hover:shadow-[0_20px_35px_-10px_rgba(16,185,129,0.22),0_10px_20px_-5px_rgba(0,0,0,0.8)]'
    }`}>
      
      {/* Top Ambient Glow Beam on Hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />

      {/* Media Thumbnail Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={thumbnail}
          alt={gig.title || 'Gig preview'}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
          }}
        />

        {/* Top-Left: Position & Choice Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 z-10">
          <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
            #{gig.position || '-'}
          </span>
          {gig.isFiverrChoice && (
            <span className="px-2 py-0.5 rounded-lg bg-purple-600/95 backdrop-blur-md text-[9px] font-extrabold text-white flex items-center space-x-1 shadow-sm">
              <Award className="h-2.5 w-2.5" />
              <span>Choice</span>
            </span>
          )}
          {gig.is_promoted && (
            <span className="px-1.5 py-0.5 rounded-lg bg-amber-500/90 backdrop-blur-md text-[9px] font-extrabold uppercase tracking-wider text-slate-950 flex items-center space-x-0.5 shadow-sm">
              <Zap className="h-2.5 w-2.5 fill-slate-950" />
              <span>Ad</span>
            </span>
          )}
        </div>

        {/* Top-Right: Compare Select Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(gig);
          }}
          title={isSelected ? 'Remove from comparison matrix' : 'Add to comparison matrix'}
          className={`absolute top-2.5 right-2.5 h-6 w-6 rounded-md flex items-center justify-center transition-all backdrop-blur-md z-10 ${
            isSelected
              ? 'bg-emerald-500 text-slate-950 shadow-md ring-1 ring-emerald-400'
              : 'bg-black/60 text-slate-300 hover:text-white hover:bg-black/80 border border-white/15'
          }`}
        >
          {isSelected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Plus className="h-3.5 w-3.5" />}
        </button>

        {/* Quick Dossier Hover Overlay */}
        <div
          onClick={() => onInspect(gig)}
          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]"
        >
          <span className="px-3 py-1 rounded-xl bg-white/95 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="h-3.5 w-3.5" />
            <span>Deep Dossier</span>
          </span>
        </div>
      </div>

      {/* Gig Content Body */}
      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
        
        <div className="space-y-2">
          {/* Seller Metadata Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="relative flex-shrink-0">
                {gig.seller_profileImage ? (
                  <img
                    src={gig.seller_profileImage}
                    alt={gig.seller_username}
                    className="h-5 w-5 rounded-full object-cover border border-white/10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300">
                    {(gig.seller_displayName || gig.seller_username || 'U')[0].toUpperCase()}
                  </div>
                )}
                {gig.seller_isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-slate-900" />
                )}
              </div>
              
              <span className="text-xs font-semibold text-white truncate">
                {gig.seller_displayName || gig.seller_username || 'Fiverr Seller'}
              </span>

              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                ({responseTime})
              </span>
            </div>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${sellerLevelColor(gig.seller_level)}`}>
              {sellerLevelLabel(gig.seller_level)}
            </span>
          </div>

          {/* Title (2 lines clamped) */}
          <h4
            onClick={() => onInspect(gig)}
            className="text-xs font-medium text-slate-200 line-clamp-2 hover:text-emerald-300 cursor-pointer transition-colors leading-snug min-h-[2.5rem]"
            title={gig.title}
          >
            {gig.title}
          </h4>
        </div>

        {/* Rating & Turnaround Row */}
        <div className="pt-2 border-t border-white/5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            {/* Rating */}
            <div className="flex items-center space-x-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-100">{Number(rating).toFixed(1)}</span>
            </div>

            {/* Delivery Turnaround */}
            <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
              <Clock className="h-3 w-3 text-slate-500" />
              <span>{deliveryDays}d delivery</span>
            </div>
          </div>

          {/* Price & Glowing Inspect Button (Exact Screenshot Match) */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono tracking-tight">
              {formatPrice(price, currencyCode)}
            </span>

            <button
              type="button"
              onClick={() => onInspect(gig)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 hover:border-emerald-400 font-bold text-xs shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:shadow-[0_0_18px_rgba(16,185,129,0.5)] transition-all cursor-pointer"
            >
              Inspect
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
