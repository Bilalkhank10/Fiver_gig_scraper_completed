import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, SlidersHorizontal, LayoutGrid, Table, ArrowUpDown,
  Sparkles, X, ChevronLeft, ChevronRight, CheckCircle2,
  ExternalLink, Eye, Star, Zap, Award, RotateCcw, Download, FileCode
} from 'lucide-react';
import GigCard from './GigCard';
import { formatPrice } from '../services/currency';

export default function GigExplorer({
  dataset,
  onInspectGig,
  selectedGigs,
  onToggleSelectGig,
  onOpenCompare,
  currencyCode = 'USD'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [promotedFilter, setPromotedFilter] = useState('all'); // 'all' | 'organic' | 'promoted'
  const [choiceOnly, setChoiceOnly] = useState(false);
  const [sortBy, setSortBy] = useState('position'); // 'position' | 'price_asc' | 'price_desc' | 'rating' | 'reviews'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 48;

  const allItems = dataset?.items || [];

  // Compute highest price in dataset for dynamic slider max
  const highestDatasetPrice = useMemo(() => {
    if (!allItems.length) return 500;
    return Math.max(...allItems.map(i => i.starting_price || 0), 100);
  }, [allItems]);

  const [maxPrice, setMaxPrice] = useState(highestDatasetPrice);

  // Sync maxPrice when dataset changes
  useEffect(() => {
    setMaxPrice(highestDatasetPrice);
    setCurrentPage(1);
  }, [dataset?.id, highestDatasetPrice]);

  // Filter & Sort Pipeline
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Keyword search in title, seller, or tags
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (item.title || '').toLowerCase().includes(q);
        const inSeller = (item.seller_username || item.seller_displayName || '').toLowerCase().includes(q);
        const inTags = String(item.tags || '').toLowerCase().includes(q);
        if (!inTitle && !inSeller && !inTags) return false;
      }

      // Seller level filter
      if (selectedLevel !== 'all') {
        const lvl = (item.seller_level || 'new_seller').toLowerCase();
        if (selectedLevel === 'top_rated' && !lvl.includes('top_rated') && lvl !== 'trs') return false;
        if (selectedLevel === 'level_two' && !lvl.includes('two')) return false;
        if (selectedLevel === 'level_one' && !lvl.includes('one')) return false;
        if (selectedLevel === 'new' && lvl !== 'new_seller' && lvl !== 'no_level') return false;
      }

      // Promoted filter
      if (promotedFilter === 'organic' && item.is_promoted) return false;
      if (promotedFilter === 'promoted' && !item.is_promoted) return false;

      // Choice filter
      if (choiceOnly && !item.isFiverrChoice) return false;

      // Max price filter
      const price = item.starting_price != null ? item.starting_price : 0;
      if (price > maxPrice) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return (a.starting_price || 0) - (b.starting_price || 0);
      if (sortBy === 'price_desc') return (b.starting_price || 0) - (a.starting_price || 0);
      if (sortBy === 'rating') return (b.seller_rating_score || b.buying_rating || 0) - (a.seller_rating_score || a.buying_rating || 0);
      if (sortBy === 'reviews') return (b.buying_review_count || b.seller_rating_count || 0) - (a.buying_review_count || a.seller_rating_count || 0);
      return (a.position || 0) - (b.position || 0);
    });
  }, [allItems, searchQuery, selectedLevel, promotedFilter, choiceOnly, maxPrice, sortBy]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 100% Pure Raw Scraped Data download (untouched, no math functions or wrapper)
  const handleDownloadRawData = () => {
    if (!dataset || !dataset.items) return;
    const rawData = dataset.items;
    const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `raw_fiverr_scraped_${dataset.id || 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* Top Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search title, seller, or tags..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <select
              value={selectedLevel}
              onChange={(e) => { setSelectedLevel(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Seller Levels</option>
              <option value="top_rated">Top Rated Only</option>
              <option value="level_two">Level 2</option>
              <option value="level_one">Level 1</option>
              <option value="new">New Sellers</option>
            </select>

            <select
              value={promotedFilter}
              onChange={(e) => { setPromotedFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All (Organic + Ads)</option>
              <option value="organic">Organic Only</option>
              <option value="promoted">Sponsored Ads Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="position">Sort: Rank Position</option>
              <option value="price_asc">Sort: Price Low → High</option>
              <option value="price_desc">Sort: Price High → Low</option>
              <option value="rating">Sort: Highest Rating</option>
              <option value="reviews">Sort: Most Reviews</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-900 rounded-xl p-1 border border-white/5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Data Table View"
              >
                <Table className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Direct 100% Pure Raw Scraped Data Download Button */}
            <button
              type="button"
              onClick={handleDownloadRawData}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-emerald-400 font-bold text-xs shadow-sm transition-all group cursor-pointer"
              title="Download 100% Untouched Raw Scraped Data (Pure JSON, no math functions or formatting)"
            >
              <Download className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              <span>Raw Data</span>
            </button>
          </div>

        </div>

        {/* Secondary Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Fiverr's Choice Pill Toggle */}
            <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition-all ${
              choiceOnly
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={choiceOnly}
                onChange={(e) => setChoiceOnly(e.target.checked)}
                className="sr-only"
              />
              <Award className={`h-3.5 w-3.5 ${choiceOnly ? 'text-amber-400 fill-amber-400/20' : 'text-slate-500'}`} />
              <span className="font-medium text-xs">Fiverr's Choice</span>
            </label>

            {/* Ultra-Premium Cyberpunk Max Price Slider Capsule */}
            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 focus-within:border-emerald-500/60 rounded-xl px-3.5 py-1.5 backdrop-blur-md shadow-sm transition-all group">
              <span className="text-slate-400 font-medium text-xs whitespace-nowrap">Max Price:</span>
              
              {/* Glowing Value Badge */}
              <span className="font-mono text-emerald-300 font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)] tracking-tight min-w-[62px] text-center">
                {formatPrice(maxPrice, currencyCode)}
              </span>

              {/* Slider Track with Dynamic Glow & Custom Styling */}
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={5}
                  max={Math.max(highestDatasetPrice, 200)}
                  value={maxPrice}
                  style={{
                    '--slider-fill': `${Math.min(100, Math.max(0, Math.round(((maxPrice - 5) / (Math.max(highestDatasetPrice, 200) - 5)) * 100)))}%`
                  }}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="premium-range-slider w-32 sm:w-44 cursor-pointer"
                  title={`Filter gigs up to ${formatPrice(maxPrice, currencyCode)}`}
                />
              </div>

              {/* Reset Button when filtered */}
              {maxPrice < Math.max(highestDatasetPrice, 200) && (
                <button
                  type="button"
                  onClick={() => setMaxPrice(Math.max(highestDatasetPrice, 200))}
                  className="p-1 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all"
                  title="Reset to max price"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>

          </div>

          <div className="text-slate-400 font-medium">
            Showing <strong className="text-emerald-400 font-bold">{filteredItems.length}</strong> of {allItems.length} gigs
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      {filteredItems.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-white/10 space-y-3">
          <SlidersHorizontal className="h-10 w-10 text-slate-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-200">No Gigs Match Your Filter Criteria</h4>
          <p className="text-xs text-slate-400">
            Try adjusting your search query, increasing maximum price, or resetting seller level filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLevel('all');
              setPromotedFilter('all');
              setChoiceOnly(false);
              setMaxPrice(highestDatasetPrice);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedItems.map(gig => (
            <GigCard
              key={gig.id || gig.url}
              gig={gig}
              onInspect={onInspectGig}
              isSelected={selectedGigs.some(g => g.id === gig.id)}
              onToggleSelect={onToggleSelectGig}
              currencyCode={currencyCode}
            />
          ))}
        </div>
      ) : (
        /* DATA TABLE VIEW */
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4 w-12">Rank</th>
                  <th className="py-3.5 px-4">Gig / Title</th>
                  <th className="py-3.5 px-4">Seller</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Starting Price</th>
                  <th className="py-3.5 px-4">Delivery</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedItems.map(gig => (
                  <tr key={gig.id || gig.url} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">
                      #{gig.position || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={gig.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                          alt=""
                          className="h-10 w-14 object-cover rounded-lg flex-shrink-0 bg-slate-800"
                        />
                        <div className="max-w-md">
                          <span
                            onClick={() => onInspectGig(gig)}
                            className="font-medium text-white hover:text-emerald-400 cursor-pointer line-clamp-1"
                          >
                            {gig.title}
                          </span>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            {gig.is_promoted && (
                              <span className="text-[9px] font-bold px-1.5 rounded bg-amber-500/20 text-amber-300">
                                SPONSORED
                              </span>
                            )}
                            {gig.isFiverrChoice && (
                              <span className="text-[9px] font-bold px-1.5 rounded bg-purple-500/20 text-purple-300">
                                CHOICE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">
                        {gig.seller_displayName || gig.seller_username}
                      </div>
                      <span className="text-[10px] text-slate-400">{gig.seller_level || 'New'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-white">
                          {Number(gig.seller_rating_score || gig.buying_rating || 5).toFixed(1)}
                        </span>
                        <span className="text-slate-500">
                          ({gig.buying_review_count || gig.seller_rating_count || 0})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                      {formatPrice(gig.starting_price, currencyCode)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {gig.delivery_days ? `${gig.delivery_days} days` : '--'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onInspectGig(gig)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Inspect Dossier"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {gig.url && (
                          <a
                            href={gig.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Open Fiverr"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-slate-400">
            Page <strong className="text-white">{currentPage}</strong> of {totalPages}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Comparison Tray */}
      {selectedGigs.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
          <div className="glass-panel p-3 px-5 rounded-2xl border border-emerald-500/40 shadow-2xl shadow-emerald-500/20 bg-[#0d131f]/95 backdrop-blur-xl flex items-center space-x-4 pointer-events-auto">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">
                {selectedGigs.length} {selectedGigs.length === 1 ? 'Gig' : 'Gigs'} Selected for Comparison
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenCompare}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Compare Matrix</span>
              </button>
              <button
                onClick={() => {
                  // Clear all
                  selectedGigs.forEach(g => onToggleSelectGig(g));
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
