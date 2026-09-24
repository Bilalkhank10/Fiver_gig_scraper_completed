#!/usr/bin/env node

/**
 * GigRadar MCP Server
 * ===================
 * Exposes the Fiverr Market Intelligence & Scraper Suite as MCP tools.
 *
 * Tools:
 *   - scrape_fiverr       — Run a Fiverr scrape job and wait for results
 *   - list_datasets       — List all saved scraping datasets
 *   - get_dataset          — Retrieve a full dataset by ID
 *   - get_market_analytics — Get analytics/stats for a dataset
 *   - search_gigs          — Filter & search gigs within a dataset
 *   - compare_gigs         — Compare selected gigs side-by-side
 *   - export_dataset       — Export a dataset to CSV, JSON, or Markdown
 *   - delete_dataset       — Delete a dataset
 *   - load_sample_dataset  — Load a built-in demo dataset
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Import core modules from the existing server codebase
import {
    listDatasets,
    getDataset,
    deleteDataset,
    saveDataset,
    exportDatasetCSV,
    computeDatasetStats
} from '../server/datasetManager.js';
import { ScrapeJob } from '../server/scraperEngine.js';
import { loadLogoDesignSampleDataset, loadWebDevSampleDataset } from '../server/sampleData.js';

// ─────────────────────────────────────────────────────────────
// MCP Server
// ─────────────────────────────────────────────────────────────

const server = new McpServer({
    name: 'gigradar',
    version: '1.0.0',
    description: 'GigRadar — Fiverr Market Intelligence & Scraper Suite. Scrape Fiverr gigs, analyze market data, compare sellers, and export insights.',
});

// ──────────────────────────────────────────
// Tool 1: scrape_fiverr
// ──────────────────────────────────────────
server.tool(
    'scrape_fiverr',
    `Scrape Fiverr for gigs matching a query. Supports three modes:
  - "search": Fast listing scrape (~48 gigs/page) with organic & ad position tracking.
  - "deep": Crawls search results then fetches every individual gig page for full package tiers, reviews, and seller dossiers.
  - "demo": Instant results using built-in benchmark data (no network needed).
Returns a dataset ID that can be used with other tools.`,
    {
        query: z.string().describe('Search query, e.g. "logo design", "wordpress developer", "video editing"'),
        mode: z.enum(['search', 'deep', 'demo']).default('demo').describe('Scrape mode: "search" (fast listing), "deep" (full details), or "demo" (instant sample data)'),
        maxPages: z.number().min(1).max(50).default(1).describe('Number of search pages to scrape (1 page ≈ 48 gigs)'),
        sortBy: z.enum(['auto', 'rating', 'new', 'price_asc', 'price_desc']).default('auto').describe('Sort order for search results'),
        skipPromoted: z.boolean().default(false).describe('If true, skip promoted/sponsored gigs'),
        dedupeGigs: z.boolean().default(true).describe('If true, remove duplicate gigs across pages'),
    },
    async ({ query, mode, maxPages, sortBy, skipPromoted, dedupeGigs }) => {
        try {
            const jobId = `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

            const scrapeMode = mode === 'deep' ? 'search+details' : 'search';
            const mockMode = mode === 'demo';

            const job = new ScrapeJob(jobId, {
                query,
                scrapeMode,
                maxPages,
                sortBy,
                skipPromoted,
                dedupeGigs,
                mockMode,
                delayMs: 1500,
            });

            // Wait for job completion
            const result = await new Promise((resolve, reject) => {
                job.on('done', (res) => resolve(res));
                job.on('error', (err) => reject(err));
                job.on('stopped', () => resolve({ datasetId: jobId, totalScraped: job.items.length, stopped: true }));
                job.run().catch(reject);
            });

            const dataset = getDataset(result.datasetId);
            const stats = dataset?.stats || result.stats || {};

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        datasetId: result.datasetId,
                        totalGigsScraped: result.totalScraped,
                        query,
                        mode,
                        summary: {
                            avgPrice: stats.avgPrice,
                            medianPrice: stats.medianPrice,
                            priceRange: `$${stats.minPrice} – $${stats.maxPrice}`,
                            avgRating: stats.avgRating,
                            totalReviews: stats.totalReviews,
                            promotedPercent: `${stats.promotedPercent}%`,
                            avgDeliveryDays: stats.avgDeliveryDays,
                            topCountries: (stats.countries || []).slice(0, 5).map(c => c.code).join(', '),
                        },
                        hint: `Use get_dataset("${result.datasetId}") to retrieve full data, or get_market_analytics("${result.datasetId}") for detailed charts and stats.`,
                    }, null, 2),
                }],
            };
        } catch (err) {
            return {
                content: [{ type: 'text', text: `Scrape failed: ${err.message}` }],
                isError: true,
            };
        }
    }
);

// ──────────────────────────────────────────
// Tool 2: list_datasets
// ──────────────────────────────────────────
server.tool(
    'list_datasets',
    'List all saved Fiverr scraping datasets with their metadata (ID, title, query, date, gig count, and summary stats).',
    {},
    async () => {
        try {
            const datasets = listDatasets();
            if (datasets.length === 0) {
                return {
                    content: [{ type: 'text', text: 'No datasets found. Use scrape_fiverr or load_sample_dataset to create one.' }],
                };
            }

            const summary = datasets.map(d => ({
                id: d.id,
                title: d.title,
                query: d.query,
                scrapeMode: d.scrapeMode,
                createdAt: d.createdAt,
                gigCount: d.itemCount,
                avgPrice: d.stats?.avgPrice,
                avgRating: d.stats?.avgRating,
            }));

            return {
                content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
            };
        } catch (err) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
    }
);

// ──────────────────────────────────────────
// Tool 3: get_dataset
// ──────────────────────────────────────────
server.tool(
    'get_dataset',
    'Retrieve a full Fiverr scraping dataset by ID. Returns all gig data including titles, prices, seller info, ratings, delivery times, URLs, and more.',
    {
        datasetId: z.string().describe('The dataset ID (from list_datasets or scrape_fiverr)'),
        limit: z.number().min(1).max(200).default(50).describe('Max number of gigs to return (for large datasets)'),
        offset: z.number().min(0).default(0).describe('Offset for pagination'),
    },
    async ({ datasetId, limit, offset }) => {
        try {
            const dataset = getDataset(datasetId);
            if (!dataset) {
                return { content: [{ type: 'text', text: `Dataset "${datasetId}" not found. Use list_datasets to see available datasets.` }], isError: true };
            }

            const items = (dataset.items || []).slice(offset, offset + limit);

            const result = {
                id: dataset.id,
                title: dataset.title,
                query: dataset.query,
                scrapeMode: dataset.scrapeMode,
                createdAt: dataset.createdAt,
                totalGigs: dataset.itemCount || dataset.items?.length || 0,
                showing: `${offset + 1}–${offset + items.length} of ${dataset.itemCount}`,
                gigs: items.map(g => ({
                    id: g.id,
                    title: g.title,
                    seller: g.seller_username || g.seller_displayName,
                    sellerCountry: g.seller_country,
                    sellerLevel: g.seller_level,
                    price: g.starting_price,
                    deliveryDays: g.delivery_days,
                    rating: g.seller_rating_score || g.buying_rating,
                    reviewCount: g.buying_review_count || g.seller_rating_count,
                    isPromoted: g.is_promoted || false,
                    isFiverrChoice: g.isFiverrChoice || false,
                    url: g.url,
                    tags: g.tags,
                    thumbnail: g.thumbnail,
                })),
            };

            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
    }
);

// ──────────────────────────────────────────
// Tool 4: get_market_analytics
// ──────────────────────────────────────────
server.tool(
    'get_market_analytics',
    `Get comprehensive market analytics for a Fiverr dataset. Returns:
  - KPIs: total gigs, average/median/min/max price, avg delivery days, avg rating, total reviews
  - Price distribution across brackets ($0-25, $25-50, $50-100, $100-250, $250+)
  - Seller level demographics (Top Rated, Level 2, Level 1, New)
  - Top 10 seller countries
  - Delivery time distribution
  - Top 15 keyword/style tags
  - Promoted vs organic breakdown`,
    {
        datasetId: z.string().describe('The dataset ID to analyze'),
    },
    async ({ datasetId }) => {
        try {
            const dataset = getDataset(datasetId);
            if (!dataset) {
                return { content: [{ type: 'text', text: `Dataset "${datasetId}" not found.` }], isError: true };
            }

            // Recompute stats fresh from raw data for accuracy
            const stats = computeDatasetStats(dataset.items || []);

            const analytics = {
                datasetId: dataset.id,
                title: dataset.title,
                query: dataset.query,
                kpis: {
                    totalGigs: stats.totalGigs,
                    avgPrice: `$${stats.avgPrice}`,
                    medianPrice: `$${stats.medianPrice}`,
                    priceRange: `$${stats.minPrice} – $${stats.maxPrice}`,
                    avgDeliveryDays: `${stats.avgDeliveryDays} days`,
                    avgRating: `${stats.avgRating}/5`,
                    totalReviews: stats.totalReviews,
                    promotedAds: `${stats.promotedCount} (${stats.promotedPercent}%)`,
                    organicGigs: stats.organicCount,
                    fiverrChoiceBadges: stats.fiverrChoiceCount,
                },
                priceDistribution: stats.priceDistribution,
                sellerLevels: stats.sellerLevels,
                topCountries: stats.countries,
                deliveryTimeDistribution: stats.deliveryDaysDistribution,
                topTags: stats.topTags,
            };

            return { content: [{ type: 'text', text: JSON.stringify(analytics, null, 2) }] };
        } catch (err) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
    }
);

// ──────────────────────────────────────────
// Tool 5: search_gigs
// ──────────────────────────────────────────
server.tool(
    'search_gigs',
    'Filter and search gigs within a saved dataset. Supports keyword search, price range, seller level, country, and promoted/organic filters.',
    {
        datasetId: z.string().describe('The dataset ID to search within'),
        keyword: z.string().optional().describe('Search keyword (matches title, seller name, tags)'),
        minPrice: z.number().optional().describe('Minimum price filter'),
        maxPrice: z.number().optional().describe('Maximum price filter'),
        sellerLevel: z.enum(['top_rated', 'level_2', 'level_1', 'new']).optional().describe('Filter by seller level'),
        country: z.string().optional().describe('Filter by seller country code (e.g. "US", "IN", "PK")'),
        onlyPromoted: z.boolean().optional().describe('If true, show only promoted gigs'),
        onlyOrganic: z.boolean().optional().describe('If true, show only organic (non-promoted) gigs'),
        sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'reviews', 'delivery']).default('rating').describe('Sort results by'),
        limit: z.number().min(1).max(100).default(20).describe('Max results to return'),
    },
    async ({ datasetId, keyword, minPrice, maxPrice, sellerLevel, country, onlyPromoted, onlyOrganic, sortBy, limit }) => {
        try {
            const dataset = getDataset(datasetId);
            if (!dataset) {
                return { content: [{ type: 'text', text: `Dataset "${datasetId}" not found.` }], isError: true };
            }

            let results = [...(dataset.items || [])];

            // Keyword filter
            if (keyword) {
                const kw = keyword.toLowerCase();
                results = results.filter(g => {
                    const title = (g.title || '').toLowerCase();
                    const seller = (g.seller_username || g.seller_displayName || '').toLowerCase();
                    const tags = Array.isArray(g.tags)
                        ? g.tags.map(t => (typeof t === 'string' ? t : t?.name || '')).join(' ').toLowerCase()
                        : '';
                    return title.includes(kw) || seller.includes(kw) || tags.includes(kw);
                });
            }

            // Price range
            if (minPrice !== undefined) results = results.filter(g => (g.starting_price || 0) >= minPrice);
            if (maxPrice !== undefined) results = results.filter(g => (g.starting_price || Infinity) <= maxPrice);

            // Seller level
            if (sellerLevel) {
                const levelMap = {
                    top_rated: ['top_rated_seller', 'trs', 'top rated'],
                    level_2: ['level_two_seller', 'level_2', 'level 2'],
                    level_1: ['level_one_seller', 'level_1', 'level 1'],
                    new: ['new_seller', 'new', ''],
                };
                const targets = levelMap[sellerLevel] || [];
                results = results.filter(g => {
                    const lvl = (g.seller_level || '').toLowerCase();
                    return targets.some(t => lvl.includes(t)) || (sellerLevel === 'new' && !lvl);
                });
            }

            // Country filter
            if (country) {
                const cc = country.toUpperCase();
                results = results.filter(g => (g.seller_country || '').toUpperCase() === cc);
            }

            // Promoted/Organic
            if (onlyPromoted) results = results.filter(g => g.is_promoted);
            if (onlyOrganic) results = results.filter(g => !g.is_promoted);

            // Sort
            const sorters = {
                price_asc: (a, b) => (a.starting_price || 0) - (b.starting_price || 0),
                price_desc: (a, b) => (b.starting_price || 0) - (a.starting_price || 0),
                rating: (a, b) => (b.seller_rating_score || b.buying_rating || 0) - (a.seller_rating_score || a.buying_rating || 0),
                reviews: (a, b) => (b.buying_review_count || b.seller_rating_count || 0) - (a.buying_review_count || a.seller_rating_count || 0),
                delivery: (a, b) => (a.delivery_days || 999) - (b.delivery_days || 999),
            };
            if (sorters[sortBy]) results.sort(sorters[sortBy]);

            const total = results.length;
            results = results.slice(0, limit);

            const output = {
                datasetId,
                totalMatches: total,
                showing: results.length,
                filters: { keyword, minPrice, maxPrice, sellerLevel, country, onlyPromoted, onlyOrganic },
                gigs: results.map(g => ({
                    id: g.id,
                    title: g.title,
                    seller: g.seller_username || g.seller_displayName,
                    sellerCountry: g.seller_country,
                    sellerLevel: g.seller_level,
                    price: g.starting_price,
                    deliveryDays: g.delivery_days,
                    rating: g.seller_rating_score || g.buying_rating,
                    reviewCount: g.buying_review_count || g.seller_rating_count,
                    isPromoted: g.is_promoted || false,
                    url: g.url,
                })),
            };

            return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
        } catch (err) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
    }
);

// ──────────────────────────────────────────
// Tool 6: compare_gigs
// ──────────────────────────────────────────
server.tool(
    'compare_gigs',
    'Compare 2 to 5 gigs side-by-side from a dataset. Generates a competitive scorecard with prices, ratings, delivery times, seller levels, and value scores.',
    {
        datasetId: z.string().describe('The dataset ID containing the gigs'),
        gigIds: z.array(z.union([z.string(), z.number()])).min(2).max(5).describe('Array of gig IDs to compare (2-5 gigs)'),
    },
    async ({ datasetId, gigIds }) => {
        try {
            const dataset = getDataset(datasetId);
            if (!dataset) {
                return { content: [{ type: 'text', text: `Dataset "${datasetId}" not found.` }], isError: true };
            }

            const idSet = new Set(gigIds.map(String));
            const gigs = (dataset.items || []).filter(g => idSet.has(String(g.id)));

            if (gigs.length < 2) {
                return {
                    content: [{
                        type: 'text',
                        text: `Only ${gigs.length} of the requested gigs were found in the dataset. Need at least 2.`,
                    }],
                    isError: true,
                };
            }

            // Calculate value scores
            const comparison = gigs.map(g => {
                const price = g.starting_price || 0;
                const rating = g.seller_rating_score || g.buying_rating || 0;
                const reviews = g.buying_review_count || g.seller_rating_count || 0;
                const delivery = g.delivery_days || 999;
                // Value score: higher rating * more reviews / price / delivery → higher is better
                const valueScore = price > 0
                    ? Math.round(((rating * Math.log2(reviews + 1)) / (price * Math.sqrt(delivery))) * 1000) / 1000
                    : 0;

                return {
                    id: g.id,
                    title: g.title,
                    seller: g.seller_username || g.seller_displayName,
                    sellerCountry: g.seller_country,
                    sellerLevel: g.seller_level,
                    price: `$${price}`,
                    deliveryDays: `${delivery} days`,
                    rating: `${rating}/5`,
                    reviewCount: reviews,
                    isPromoted: g.is_promoted || false,
                    isFiverrChoice: g.isFiverrChoice || false,
                    url: g.url,
                    valueScore,
                    packages: g.packages || null,
                };
            });

            // Rank by value score
            comparison.sort((a, b) => b.valueScore - a.valueScore);
            comparison.forEach((g, i) => { g.rank = i + 1; });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        comparison,
                        bestValue: comparison[0]?.title,
                        note: 'Value score = (rating × log₂(reviews+1)) / (price × √delivery). Higher is better.',
                    }, null, 2),
                }],
            };
        } catch (err) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
    }
);

// ──────────────────────────────────────────
// Tool 7: export_dataset
// ──────────────────────────────────────────
server.tool(
    'export_dataset',
    'Export a dataset in CSV, JSON, or Markdown report format. Returns the formatted data as text.',
    {
        datasetId: z.string().describe('The dataset ID to export'),
        format: z.enum(['csv', 'json', 'markdown']).default('csv').describe('Export format'),
    },
    async ({ datasetId, format }) => {
        try {
            const dataset = getDataset(datasetId);
            if (!dataset) {
                return { content: [{ type: 'text', text: `Dataset "${datasetId}" not found.` }], isError: true };
            }

            if (format === 'csv') {
                const csv = exportDatasetCSV(dataset.items || []);
                return { content: [{ type: 'text', text: csv || 'No items to export.' }] };
            }

            if (format === 'json') {
                return {
                    content: [{ type: 'text', text: JSON.stringify(dataset, null, 2) }],
                };
            }

            // Markdown report
            if (format === 'markdown') {
                const stats = dataset.stats || computeDatasetStats(dataset.items || []);
                const items = dataset.items || [];

                let md = `# 📊 GigRadar Market Report\n\n`;
                md += `**Query:** ${dataset.query}  \n`;
                md += `**Date:** ${dataset.createdAt}  \n`;
                md += `**Total Gigs:** ${stats.totalGigs}  \n\n`;

                md += `## 💰 Pricing Overview\n\n`;
                md += `| Metric | Value |\n|--------|-------|\n`;
                md += `| Average Price | $${stats.avgPrice} |\n`;
                md += `| Median Price | $${stats.medianPrice} |\n`;
                md += `| Price Range | $${stats.minPrice} – $${stats.maxPrice} |\n\n`;

                md += `## ⭐ Quality Metrics\n\n`;
                md += `| Metric | Value |\n|--------|-------|\n`;
                md += `| Average Rating | ${stats.avgRating}/5 |\n`;
                md += `| Total Reviews | ${stats.totalReviews.toLocaleString()} |\n`;
                md += `| Avg Delivery | ${stats.avgDeliveryDays} days |\n`;
                md += `| Promoted Ads | ${stats.promotedCount} (${stats.promotedPercent}%) |\n\n`;

                if (stats.priceDistribution?.length) {
                    md += `## 📈 Price Distribution\n\n`;
                    md += `| Bracket | Count |\n|---------|-------|\n`;
                    stats.priceDistribution.forEach(b => { md += `| ${b.range} | ${b.count} |\n`; });
                    md += '\n';
                }

                if (stats.sellerLevels?.length) {
                    md += `## 👤 Seller Levels\n\n`;
                    md += `| Level | Count |\n|-------|-------|\n`;
                    stats.sellerLevels.forEach(s => { md += `| ${s.label} | ${s.count} |\n`; });
                    md += '\n';
                }

                if (stats.countries?.length) {
                    md += `## 🌍 Top Countries\n\n`;
                    md += `| Country | Sellers |\n|---------|--------|\n`;
                    stats.countries.forEach(c => { md += `| ${c.code} | ${c.count} |\n`; });
                    md += '\n';
                }

                if (stats.topTags?.length) {
                    md += `## 🏷️ Top Tags\n\n`;
                    md += stats.topTags.map(t => `\`${t.name}\` (${t.count})`).join(', ') + '\n\n';
                }

                md += `## 📋 Top 20 Gigs\n\n`;
                md += `| # | Title | Seller | Price | Rating | Reviews | Delivery |\n`;
                md += `|---|-------|--------|-------|--------|---------|----------|\n`;
                items.slice(0, 20).forEach((g, i) => {
                    md += `| ${i + 1} | ${(g.title || '').slice(0, 60)} | ${g.seller_username || '—'} | $${g.starting_price || '?'} | ${g.seller_rating_score || g.buying_rating || '—'} | ${g.buying_review_count || g.seller_rating_count || 0} | ${g.delivery_days || '?'}d |\n`;
                });

                return { content: [{ type: 'text', text: md }] };
            }

            return { content: [{ type: 'text', text: 'Unsupported format.' }], isError: true };
        } catch (err) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
    }
);

// ──────────────────────────────────────────
// Tool 8: delete_dataset
// ──────────────────────────────────────────
server.tool(
    'delete_dataset',
    'Delete a saved Fiverr scraping dataset by ID.',
    {
        datasetId: z.string().describe('The dataset ID to delete'),
    },
    async ({ datasetId }) => {
        try {
            const ok = deleteDataset(datasetId);
            if (!ok) {
                return { content: [{ type: 'text', text: `Dataset "${datasetId}" not found.` }], isError: true };
            }
            return { content: [{ type: 'text', text: `Dataset "${datasetId}" deleted successfully.` }] };
        } catch (err) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
    }
);

// ──────────────────────────────────────────
// Tool 9: load_sample_dataset
// ──────────────────────────────────────────
server.tool(
    'load_sample_dataset',
    'Load a built-in demo/benchmark dataset for instant exploration without needing network access or proxies. Great for testing and demos.',
    {
        type: z.enum(['logo_design', 'web_development']).default('logo_design').describe('Which sample dataset to load'),
    },
    async ({ type }) => {
        try {
            const sample = type === 'web_development' ? loadWebDevSampleDataset() : loadLogoDesignSampleDataset();
            if (!sample) {
                return { content: [{ type: 'text', text: 'Failed to load sample dataset. Sample HTML files may be missing.' }], isError: true };
            }

            const uniqueId = `sample_${type}_${Date.now().toString().slice(-6)}`;
            const saved = saveDataset(uniqueId, {
                title: sample.title,
                query: sample.query,
                scrapeMode: sample.scrapeMode,
            }, sample.items);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        datasetId: uniqueId,
                        title: saved.title,
                        gigCount: saved.itemCount,
                        avgPrice: saved.stats?.avgPrice,
                        avgRating: saved.stats?.avgRating,
                        hint: `Use get_market_analytics("${uniqueId}") for full analytics, or search_gigs("${uniqueId}") to explore.`,
                    }, null, 2),
                }],
            };
        } catch (err) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
    }
);

// ─────────────────────────────────────────────────────────────
// Start the server
// ─────────────────────────────────────────────────────────────

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🎯 GigRadar MCP Server running on stdio');
}

main().catch((err) => {
    console.error('Fatal error starting MCP server:', err);
    process.exit(1);
});
