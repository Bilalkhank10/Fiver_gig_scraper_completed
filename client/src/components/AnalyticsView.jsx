import React, { useMemo } from 'react';
import {
  DollarSign, TrendingUp, Users, Award, Clock, Star,
  Tag, Compass, ShieldCheck, Zap, PieChart as PieIcon, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatPrice } from '../services/currency';

export default function AnalyticsView({ dataset, currencyCode = 'USD' }) {
  if (!dataset) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Compass className="h-12 w-12 text-slate-600 mx-auto animate-pulse mb-3" />
        <h3 className="text-lg font-bold text-slate-300">No Dataset Selected</h3>
        <p className="text-sm text-slate-500 mt-1">Please select or scrape a dataset to analyze market intelligence.</p>
      </div>
    );
  }

  const items = dataset.items || [];

  // Compute analytics dynamically with robust fallback if dataset.stats is missing or partial
  const stats = useMemo(() => {
    const rawStats = dataset.stats;
    if (rawStats && rawStats.avgPrice !== undefined && rawStats.priceDistribution?.length) {
      return rawStats;
    }

    // Dynamic on-the-fly computation
    const prices = items
      .map(i => Number(i.starting_price ?? i.price))
      .filter(p => !isNaN(p) && p > 0)
      .sort((a, b) => a - b);

    const minPrice = prices.length ? prices[0] : 0;
    const maxPrice = prices.length ? prices[prices.length - 1] : 0;
    const avgPrice = prices.length ? Math.round((prices.reduce((sum, p) => sum + p, 0) / prices.length) * 100) / 100 : 0;

    const mid = Math.floor(prices.length / 2);
    const medianPrice = prices.length
      ? (prices.length % 2 !== 0 ? prices[mid] : Math.round(((prices[mid - 1] + prices[mid]) / 2) * 100) / 100)
      : 0;

    const buckets = [
      { range: 'Under $25', count: 0, min: 0, max: 24.99 },
      { range: '$25 - $50', count: 0, min: 25, max: 50 },
      { range: '$51 - $100', count: 0, min: 50.01, max: 100 },
      { range: '$101 - $250', count: 0, min: 100.01, max: 250 },
      { range: '$250+', count: 0, min: 250.01, max: Infinity }
    ];
    for (const p of prices) {
      for (const b of buckets) {
        if (p >= b.min && p <= b.max) {
          b.count++;
          break;
        }
      }
    }

    const friendlyLevel = (lvl) => {
      if (!lvl) return 'New Seller';
      const s = String(lvl).toLowerCase();
      if (s.includes('top_rated') || s.includes('trs') || s.includes('top rated')) return 'Top Rated';
      if (s.includes('two') || s.includes('level_2') || s.includes('level 2')) return 'Level 2';
      if (s.includes('one') || s.includes('level_1') || s.includes('level 1')) return 'Level 1';
      return 'New Seller';
    };

    const levelCounts = { 'Top Rated': 0, 'Level 2': 0, 'Level 1': 0, 'New Seller': 0 };
    for (const item of items) {
      const label = friendlyLevel(item.seller_level);
      levelCounts[label] = (levelCounts[label] || 0) + 1;
    }
    const sellerLevels = Object.entries(levelCounts)
      .filter(([, c]) => c > 0)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    const countryCounts = {};
    for (const item of items) {
      if (item.seller_country && typeof item.seller_country === 'string') {
        const c = item.seller_country.trim().toUpperCase();
        if (c) countryCounts[c] = (countryCounts[c] || 0) + 1;
      }
    }
    const countries = Object.entries(countryCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const promotedCount = items.filter(i => Boolean(i.is_promoted)).length;
    const promotedPercent = items.length ? Math.round((promotedCount / items.length) * 100) : 0;
    const fiverrChoiceCount = items.filter(i => Boolean(i.isFiverrChoice)).length;

    const deliveryDays = items.map(i => Number(i.delivery_days)).filter(d => !isNaN(d) && d > 0);
    const avgDeliveryDays = deliveryDays.length
      ? Math.round((deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length) * 10) / 10
      : 0;

    const deliveryBuckets = [
      { days: '1 Day', count: 0 },
      { days: '2-3 Days', count: 0 },
      { days: '4-7 Days', count: 0 },
      { days: '8+ Days', count: 0 }
    ];
    for (const d of deliveryDays) {
      if (d <= 1) deliveryBuckets[0].count++;
      else if (d <= 3) deliveryBuckets[1].count++;
      else if (d <= 7) deliveryBuckets[2].count++;
      else deliveryBuckets[3].count++;
    }

    const ratings = items.map(i => Number(i.seller_rating_score || i.buying_rating)).filter(r => !isNaN(r) && r > 0);
    const avgRating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100 : 0;
    const totalReviews = items.reduce((sum, i) => sum + (Number(i.buying_review_count || i.seller_rating_count) || 0), 0);

    const tagCounts = {};
    for (const item of items) {
      if (item.tags) {
        const raw = Array.isArray(item.tags) ? item.tags : String(item.tags).split(',');
        for (const t of raw) {
          const tagStr = typeof t === 'string' ? t : (t?.name || t?.label || String(t || ''));
          const cleaned = tagStr.trim();
          if (cleaned && cleaned !== '[object Object]' && cleaned.length > 1) {
            tagCounts[cleaned] = (tagCounts[cleaned] || 0) + 1;
          }
        }
      }
    }
    const topTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return {
      totalGigs: items.length,
      avgPrice,
      medianPrice,
      minPrice,
      maxPrice,
      promotedCount,
      organicCount: items.length - promotedCount,
      promotedPercent,
      fiverrChoiceCount,
      avgDeliveryDays,
      avgRating,
      totalReviews,
      priceDistribution: buckets.map(b => ({ range: b.range, count: b.count })),
      sellerLevels,
      countries,
      topTags,
      deliveryDaysDistribution: deliveryBuckets
    };
  }, [dataset, items]);

  // Localize the Price Tier distribution labels with the active currency
  const localizedPriceDistribution = useMemo(() => {
    const raw = stats.priceDistribution || [];
    const thresholdLabels = [
      `Under ${formatPrice(25, currencyCode)}`,
      `${formatPrice(25, currencyCode)} - ${formatPrice(50, currencyCode)}`,
      `${formatPrice(50, currencyCode)} - ${formatPrice(100, currencyCode)}`,
      `${formatPrice(100, currencyCode)} - ${formatPrice(250, currencyCode)}`,
      `${formatPrice(250, currencyCode)}+`
    ];
    return raw.map((b, idx) => ({
      ...b,
      range: thresholdLabels[idx] || b.range
    }));
  }, [stats.priceDistribution, currencyCode]);

  // Chronologically sort delivery days distribution so order is always 1 Day -> 2-3 Days -> 4-7 Days -> 8+ Days
  const orderedDeliveryDays = useMemo(() => {
    const raw = stats.deliveryDaysDistribution || [];
    const order = ['1 Day', '2-3 Days', '4-7 Days', '8+ Days'];
    return [...raw].sort((a, b) => order.indexOf(a.days) - order.indexOf(b.days));
  }, [stats.deliveryDaysDistribution]);

  const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-white mb-1">{label || payload[0].name}</p>
          <p className="text-emerald-400 font-mono font-medium">
            {payload[0].value} {payload[0].value === 1 ? 'Gig' : 'Gigs'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Dataset Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">Market Intelligence Dossier</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">{dataset.scrapeMode?.toUpperCase() || 'SEARCH'} MODE</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">{dataset.title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Query: <span className="text-slate-200 font-mono font-semibold">"{dataset.query}"</span> • Scraped {new Date(dataset.createdAt).toLocaleDateString()} at {new Date(dataset.createdAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300 flex items-center space-x-1.5">
            <Tag className="h-3.5 w-3.5 text-emerald-400" />
            <span>Analyzed {items.length} Live Records</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Gigs</span>
            <Tag className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{stats.totalGigs || items.length}</p>
          <span className="text-[10px] text-slate-400">Ranked Listings</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Price</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {formatPrice(stats.avgPrice, currencyCode)}
          </p>
          <span className="text-[10px] text-slate-400">Starting price baseline</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Median Price</span>
            <TrendingUp className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black text-teal-300 mt-2 font-mono">
            {formatPrice(stats.medianPrice, currencyCode)}
          </p>
          <span className="text-[10px] text-slate-400">50th percentile price</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Delivery</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{stats.avgDeliveryDays || 0}d</p>
          <span className="text-[10px] text-slate-400">Turnaround time</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Promoted Ads</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2 font-mono">{stats.promotedPercent || 0}%</p>
          <span className="text-[10px] text-slate-400">{stats.promotedCount || 0} sponsored slots</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Choice Gigs</span>
            <Award className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-300 mt-2 font-mono">{stats.fiverrChoiceCount || 0}</p>
          <span className="text-[10px] text-slate-400">Fiverr's Choice badge</span>
        </div>

      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Price Tier Distribution (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Starting Price Distribution</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Min {formatPrice(stats.minPrice, currencyCode)} — Max {formatPrice(stats.maxPrice, currencyCode)}
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={localizedPriceDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="range" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400">
            Identifies pricing clustering and opportunity gaps in the {dataset.query} niche.
          </p>
        </div>

        {/* Seller Level Demographics (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PieIcon className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Seller Level Breakdown</h3>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {stats.sellerLevels && stats.sellerLevels.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.sellerLevels}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {stats.sellerLevels.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No seller level data recorded.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Secondary Row: Geographic Origins & Delivery Days */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Geographic Demographics (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Top Seller Origin Countries</h3>
            </div>
            <span className="text-xs text-slate-400">ISO Country Codes</span>
          </div>

          <div className="h-60 w-full pt-2">
            {stats.countries && stats.countries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.countries}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis dataKey="code" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12 space-y-2">
                <Users className="h-8 w-8 text-slate-600" />
                <p>Seller origin countries are extracted in Deep Scrape mode.</p>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Turnaround Days (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Turnaround Delivery Windows</h3>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            {orderedDeliveryDays && orderedDeliveryDays.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderedDeliveryDays} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <XAxis dataKey="days" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12 space-y-2">
                <Clock className="h-8 w-8 text-slate-600" />
                <p>Delivery turnaround metadata not available.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Keyword & Style Tags Cloud */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Dominant Style & Keyword Tags</h3>
          </div>
          <span className="text-xs text-slate-400">Frequency across top-ranked gigs</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {(stats.topTags && stats.topTags.length > 0) ? (
            stats.topTags.map(tag => (
              <div
                key={tag.name}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-200">{tag.name}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  {tag.count}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No tag metadata found in this dataset.</p>
          )}
        </div>
      </div>

    </div>
  );
}
