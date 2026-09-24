import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../.data/datasets');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function computeDatasetStats(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return {
            totalGigs: 0,
            avgPrice: 0,
            medianPrice: 0,
            minPrice: 0,
            maxPrice: 0,
            promotedCount: 0,
            organicCount: 0,
            promotedPercent: 0,
            fiverrChoiceCount: 0,
            avgDeliveryDays: 0,
            avgRating: 0,
            totalReviews: 0,
            priceDistribution: [],
            sellerLevels: [],
            countries: [],
            topTags: [],
            deliveryDaysDistribution: []
        };
    }

    const prices = items
        .map(i => Number(i.starting_price ?? i.price))
        .filter(p => !isNaN(p) && p > 0)
        .sort((a, b) => a - b);

    const minPrice = prices.length ? prices[0] : 0;
    const maxPrice = prices.length ? prices[prices.length - 1] : 0;
    const avgPrice = prices.length ? Math.round((prices.reduce((sum, p) => sum + p, 0) / prices.length) * 100) / 100 : 0;

    // Statistically Exact Median (handles both odd and even sample sizes)
    const mid = Math.floor(prices.length / 2);
    const medianPrice = prices.length
        ? (prices.length % 2 !== 0 ? prices[mid] : Math.round(((prices[mid - 1] + prices[mid]) / 2) * 100) / 100)
        : 0;

    // Price Distribution Buckets (Standard benchmark tiers)
    const buckets = [
        { label: 'Under $25', count: 0, min: 0, max: 24.99 },
        { label: '$25 - $50', count: 0, min: 25, max: 50 },
        { label: '$51 - $100', count: 0, min: 50.01, max: 100 },
        { label: '$101 - $250', count: 0, min: 100.01, max: 250 },
        { label: '$250+', count: 0, min: 250.01, max: Infinity }
    ];
    for (const p of prices) {
        for (const b of buckets) {
            if (p >= b.min && p <= b.max) {
                b.count++;
                break;
            }
        }
    }
    const priceDistribution = buckets.map(b => ({ range: b.label, count: b.count }));

    // Seller Levels (Robust multi-variant normalization)
    const friendlyLevelName = (lvl) => {
        if (!lvl) return 'New Seller';
        const str = String(lvl).toLowerCase();
        if (str.includes('top_rated') || str.includes('trs') || str.includes('top rated')) return 'Top Rated';
        if (str.includes('two') || str.includes('level_2') || str.includes('level 2')) return 'Level 2';
        if (str.includes('one') || str.includes('level_1') || str.includes('level 1')) return 'Level 1';
        return 'New Seller';
    };

    const levelCounts = {
        'Top Rated': 0,
        'Level 2': 0,
        'Level 1': 0,
        'New Seller': 0
    };
    for (const item of items) {
        const label = friendlyLevelName(item.seller_level);
        levelCounts[label] = (levelCounts[label] || 0) + 1;
    }
    const sellerLevels = Object.entries(levelCounts)
        .filter(([, count]) => count > 0)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

    // Countries
    const countryCounts = {};
    for (const item of items) {
        if (item.seller_country && typeof item.seller_country === 'string') {
            const code = item.seller_country.trim().toUpperCase();
            if (code) countryCounts[code] = (countryCounts[code] || 0) + 1;
        }
    }
    const countries = Object.entries(countryCounts)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Promoted vs Organic
    const promotedCount = items.filter(i => Boolean(i.is_promoted)).length;
    const organicCount = items.length - promotedCount;
    const promotedPercent = items.length ? Math.round((promotedCount / items.length) * 100) : 0;
    const fiverrChoiceCount = items.filter(i => Boolean(i.isFiverrChoice)).length;

    // Delivery Days (Chronologically ordered buckets)
    const deliveryDays = items
        .map(i => Number(i.delivery_days))
        .filter(d => !isNaN(d) && d > 0);

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
    const deliveryDaysDistribution = deliveryBuckets;

    // Ratings & Reviews
    const ratings = items
        .map(i => Number(i.seller_rating_score || i.buying_rating))
        .filter(r => !isNaN(r) && r > 0);

    const avgRating = ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
        : 0;

    const totalReviews = items.reduce((sum, i) => sum + (Number(i.buying_review_count || i.seller_rating_count) || 0), 0);

    // Tags frequency
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
        organicCount,
        promotedPercent,
        fiverrChoiceCount,
        avgDeliveryDays,
        avgRating,
        totalReviews,
        priceDistribution,
        sellerLevels,
        countries,
        topTags,
        deliveryDaysDistribution
    };
}

export function saveDataset(id, metadata, items) {
    const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(DATA_DIR, `${safeId}.json`);
    const stats = computeDatasetStats(items);
    const data = {
        id: safeId,
        ...metadata,
        createdAt: metadata.createdAt || new Date().toISOString(),
        itemCount: items.length,
        stats,
        items
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return data;
}

export function listDatasets() {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const list = [];
    for (const f of files) {
        try {
            const full = path.join(DATA_DIR, f);
            const content = JSON.parse(fs.readFileSync(full, 'utf8'));
            list.push({
                id: content.id,
                title: content.title || content.query || 'Untitled Dataset',
                query: content.query,
                scrapeMode: content.scrapeMode,
                createdAt: content.createdAt,
                itemCount: content.itemCount || (content.items ? content.items.length : 0),
                stats: content.stats
            });
        } catch (err) {
            console.error(`Failed to read dataset ${f}:`, err);
        }
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getDataset(id) {
    const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(DATA_DIR, `${safeId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function deleteDataset(id) {
    const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(DATA_DIR, `${safeId}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

export function exportDatasetCSV(items) {
    if (!items || items.length === 0) return '';
    const headers = [
        'ID', 'Title', 'Seller', 'Seller Country', 'Seller Level', 'Rating',
        'Review Count', 'Starting Price ($)', 'Delivery Days', 'Is Promoted',
        'Fiverr Choice', 'URL'
    ];

    const escapeCsv = (str) => {
        let val = String(str || '');
        if (/^[=+\-@]/.test(val)) val = "'" + val; // Prevent CSV injection
        return `"${val.replace(/"/g, '""')}"`;
    };

    const rows = items.map(i => [
        i.id || '',
        escapeCsv(i.title),
        escapeCsv(i.seller_username || i.seller_displayName),
        i.seller_country || '',
        i.seller_level || '',
        i.seller_rating_score || i.buying_rating || '',
        i.buying_review_count || i.seller_rating_count || 0,
        i.starting_price != null ? i.starting_price : '',
        i.delivery_days || '',
        i.is_promoted ? 'YES' : 'NO',
        i.isFiverrChoice ? 'YES' : 'NO',
        escapeCsv(i.url)
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
