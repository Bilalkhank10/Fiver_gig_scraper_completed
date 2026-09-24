#!/usr/bin/env node

/**
 * GigRadar HTTP API Bridge
 * ========================
 * Exposes all GigRadar MCP tools as REST API endpoints accessible
 * over the network. Use with ngrok/cloudflare tunnel to connect
 * to ChatGPT Custom GPTs, Gemini, or any web-based AI.
 *
 * Usage:
 *   node http-bridge.js                  → http://localhost:3456
 *   PORT=8080 node http-bridge.js        → http://localhost:8080
 */

import express from 'express';
import cors from 'cors';
import {
    listDatasets,
    getDataset,
    deleteDataset,
    saveDataset,
    exportDatasetCSV,
    computeDatasetStats,
} from '../server/datasetManager.js';
import { ScrapeJob } from '../server/scraperEngine.js';
import { loadLogoDesignSampleDataset, loadWebDevSampleDataset } from '../server/sampleData.js';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// Serve OpenAPI spec (for ChatGPT / Gemini)
// ─────────────────────────────────────────
app.get('/openapi.json', (req, res) => {
    const spec = JSON.parse(readFileSync(path.join(__dirname, 'openapi.json'), 'utf8'));
    // Dynamically set the server URL to wherever this is running
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    spec.servers = [{ url: `${proto}://${host}`, description: 'GigRadar API' }];
    res.json(spec);
});

app.get('/', (req, res) => {
    res.json({
        name: 'GigRadar API',
        version: '1.0.0',
        description: 'Fiverr Market Intelligence & Scraper Suite — REST API for AI integrations',
        docs: `http://${req.headers.host}/openapi.json`,
        endpoints: [
            'POST /api/scrape',
            'GET  /api/datasets',
            'GET  /api/datasets/:id',
            'GET  /api/datasets/:id/analytics',
            'POST /api/datasets/:id/search',
            'POST /api/datasets/:id/compare',
            'GET  /api/datasets/:id/export?format=csv|json|markdown',
            'DELETE /api/datasets/:id',
            'POST /api/load-sample',
        ],
    });
});

// ─────────────────────────────────────────
// 1. Scrape Fiverr
// ─────────────────────────────────────────
app.post('/api/scrape', async (req, res) => {
    try {
        const {
            query = 'logo design',
            mode = 'demo',
            maxPages = 1,
            sortBy = 'auto',
            skipPromoted = false,
            dedupeGigs = true,
        } = req.body;

        const jobId = `api_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const scrapeMode = mode === 'deep' ? 'search+details' : 'search';
        const mockMode = mode === 'demo';

        const job = new ScrapeJob(jobId, {
            query, scrapeMode, maxPages, sortBy,
            skipPromoted, dedupeGigs, mockMode, delayMs: 1500,
        });

        const result = await new Promise((resolve, reject) => {
            job.on('done', resolve);
            job.on('error', reject);
            job.on('stopped', () => resolve({ datasetId: jobId, totalScraped: job.items.length, stopped: true }));
            job.run().catch(reject);
        });

        const dataset = getDataset(result.datasetId);
        const stats = dataset?.stats || {};

        res.json({
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
                topCountries: (stats.countries || []).slice(0, 5).map(c => c.code),
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// 2. List Datasets
// ─────────────────────────────────────────
app.get('/api/datasets', (req, res) => {
    try {
        const datasets = listDatasets().map(d => ({
            id: d.id,
            title: d.title,
            query: d.query,
            scrapeMode: d.scrapeMode,
            createdAt: d.createdAt,
            gigCount: d.itemCount,
            avgPrice: d.stats?.avgPrice,
            avgRating: d.stats?.avgRating,
        }));
        res.json({ datasets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// 3. Get Dataset
// ─────────────────────────────────────────
app.get('/api/datasets/:id', (req, res) => {
    try {
        const dataset = getDataset(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const items = (dataset.items || []).slice(offset, offset + limit);

        res.json({
            id: dataset.id,
            title: dataset.title,
            query: dataset.query,
            scrapeMode: dataset.scrapeMode,
            createdAt: dataset.createdAt,
            totalGigs: dataset.itemCount || dataset.items?.length || 0,
            showing: `${offset + 1}–${offset + items.length}`,
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
            })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// 4. Market Analytics
// ─────────────────────────────────────────
app.get('/api/datasets/:id/analytics', (req, res) => {
    try {
        const dataset = getDataset(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

        const stats = computeDatasetStats(dataset.items || []);

        res.json({
            datasetId: dataset.id,
            title: dataset.title,
            query: dataset.query,
            kpis: {
                totalGigs: stats.totalGigs,
                avgPrice: stats.avgPrice,
                medianPrice: stats.medianPrice,
                minPrice: stats.minPrice,
                maxPrice: stats.maxPrice,
                avgDeliveryDays: stats.avgDeliveryDays,
                avgRating: stats.avgRating,
                totalReviews: stats.totalReviews,
                promotedCount: stats.promotedCount,
                promotedPercent: stats.promotedPercent,
                organicCount: stats.organicCount,
                fiverrChoiceCount: stats.fiverrChoiceCount,
            },
            priceDistribution: stats.priceDistribution,
            sellerLevels: stats.sellerLevels,
            topCountries: stats.countries,
            deliveryTimeDistribution: stats.deliveryDaysDistribution,
            topTags: stats.topTags,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// 5. Search Gigs
// ─────────────────────────────────────────
app.post('/api/datasets/:id/search', (req, res) => {
    try {
        const dataset = getDataset(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

        const {
            keyword, minPrice, maxPrice, sellerLevel,
            country, onlyPromoted, onlyOrganic,
            sortBy = 'rating', limit = 20,
        } = req.body;

        let results = [...(dataset.items || [])];

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

        if (minPrice !== undefined) results = results.filter(g => (g.starting_price || 0) >= minPrice);
        if (maxPrice !== undefined) results = results.filter(g => (g.starting_price || Infinity) <= maxPrice);

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

        if (country) results = results.filter(g => (g.seller_country || '').toUpperCase() === country.toUpperCase());
        if (onlyPromoted) results = results.filter(g => g.is_promoted);
        if (onlyOrganic) results = results.filter(g => !g.is_promoted);

        const sorters = {
            price_asc: (a, b) => (a.starting_price || 0) - (b.starting_price || 0),
            price_desc: (a, b) => (b.starting_price || 0) - (a.starting_price || 0),
            rating: (a, b) => (b.seller_rating_score || b.buying_rating || 0) - (a.seller_rating_score || a.buying_rating || 0),
            reviews: (a, b) => (b.buying_review_count || 0) - (a.buying_review_count || 0),
            delivery: (a, b) => (a.delivery_days || 999) - (b.delivery_days || 999),
        };
        if (sorters[sortBy]) results.sort(sorters[sortBy]);

        const total = results.length;
        results = results.slice(0, Math.min(limit, 100));

        res.json({
            totalMatches: total,
            showing: results.length,
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
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// 6. Compare Gigs
// ─────────────────────────────────────────
app.post('/api/datasets/:id/compare', (req, res) => {
    try {
        const dataset = getDataset(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

        const { gigIds = [] } = req.body;
        if (gigIds.length < 2 || gigIds.length > 5) {
            return res.status(400).json({ error: 'Provide 2–5 gig IDs to compare' });
        }

        const idSet = new Set(gigIds.map(String));
        const gigs = (dataset.items || []).filter(g => idSet.has(String(g.id)));

        if (gigs.length < 2) {
            return res.status(404).json({ error: `Only ${gigs.length} of the requested gigs found` });
        }

        const comparison = gigs.map(g => {
            const price = g.starting_price || 0;
            const rating = g.seller_rating_score || g.buying_rating || 0;
            const reviews = g.buying_review_count || g.seller_rating_count || 0;
            const delivery = g.delivery_days || 999;
            const valueScore = price > 0
                ? Math.round(((rating * Math.log2(reviews + 1)) / (price * Math.sqrt(delivery))) * 1000) / 1000
                : 0;

            return {
                id: g.id, title: g.title,
                seller: g.seller_username || g.seller_displayName,
                sellerCountry: g.seller_country, sellerLevel: g.seller_level,
                price, deliveryDays: delivery, rating, reviewCount: reviews,
                isPromoted: g.is_promoted || false,
                url: g.url, valueScore,
            };
        });

        comparison.sort((a, b) => b.valueScore - a.valueScore);
        comparison.forEach((g, i) => { g.rank = i + 1; });

        res.json({ comparison, bestValue: comparison[0]?.title });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// 7. Export Dataset
// ─────────────────────────────────────────
app.get('/api/datasets/:id/export', (req, res) => {
    try {
        const dataset = getDataset(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

        const format = req.query.format || 'json';

        if (format === 'csv') {
            const csv = exportDatasetCSV(dataset.items || []);
            res.setHeader('Content-Type', 'text/csv');
            return res.send(csv);
        }

        if (format === 'markdown') {
            const stats = dataset.stats || computeDatasetStats(dataset.items || []);
            const items = dataset.items || [];
            let md = `# GigRadar Market Report\n\n`;
            md += `**Query:** ${dataset.query}\n**Date:** ${dataset.createdAt}\n**Total Gigs:** ${stats.totalGigs}\n\n`;
            md += `## Pricing\n| Metric | Value |\n|--------|-------|\n`;
            md += `| Average | $${stats.avgPrice} |\n| Median | $${stats.medianPrice} |\n| Range | $${stats.minPrice} – $${stats.maxPrice} |\n\n`;
            md += `## Quality\n| Metric | Value |\n|--------|-------|\n`;
            md += `| Avg Rating | ${stats.avgRating}/5 |\n| Total Reviews | ${stats.totalReviews} |\n| Avg Delivery | ${stats.avgDeliveryDays} days |\n\n`;
            md += `## Top 20 Gigs\n| # | Title | Seller | Price | Rating | Reviews |\n|---|-------|--------|-------|--------|--------|\n`;
            items.slice(0, 20).forEach((g, i) => {
                md += `| ${i + 1} | ${(g.title || '').slice(0, 50)} | ${g.seller_username || '—'} | $${g.starting_price || '?'} | ${g.seller_rating_score || '—'} | ${g.buying_review_count || 0} |\n`;
            });
            res.setHeader('Content-Type', 'text/markdown');
            return res.send(md);
        }

        res.json(dataset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// 8. Delete Dataset
// ─────────────────────────────────────────
app.delete('/api/datasets/:id', (req, res) => {
    try {
        const ok = deleteDataset(req.params.id);
        if (!ok) return res.status(404).json({ error: 'Dataset not found' });
        res.json({ success: true, message: `Dataset "${req.params.id}" deleted.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// 9. Load Sample Dataset
// ─────────────────────────────────────────
app.post('/api/load-sample', (req, res) => {
    try {
        const { type = 'logo_design' } = req.body;
        const sample = type === 'web_development' ? loadWebDevSampleDataset() : loadLogoDesignSampleDataset();
        if (!sample) return res.status(500).json({ error: 'Failed to load sample data' });

        const uniqueId = `sample_${type}_${Date.now().toString().slice(-6)}`;
        const saved = saveDataset(uniqueId, {
            title: sample.title, query: sample.query, scrapeMode: sample.scrapeMode,
        }, sample.items);

        res.json({
            success: true,
            datasetId: uniqueId,
            title: saved.title,
            gigCount: saved.itemCount,
            avgPrice: saved.stats?.avgPrice,
            avgRating: saved.stats?.avgRating,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// Start
// ─────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🎯 GigRadar API Bridge running at http://localhost:${PORT}`);
    console.log(`📄 OpenAPI spec:  http://localhost:${PORT}/openapi.json`);
    console.log(`\n💡 To expose publicly for ChatGPT/Gemini:`);
    console.log(`   npx ngrok http ${PORT}\n`);
});
