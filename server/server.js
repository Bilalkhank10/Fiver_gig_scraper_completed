import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    listDatasets, getDataset, deleteDataset, saveDataset, exportDatasetCSV
} from './datasetManager.js';
import { ScrapeJob } from './scraperEngine.js';
import { loadLogoDesignSampleDataset, loadWebDevSampleDataset } from './sampleData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory active scrape jobs
const activeJobs = new Map();

// Auto-seed sample datasets on first launch if none exist
function seedSampleDatasets() {
    const existing = listDatasets();
    if (existing.length === 0) {
        console.log('🌱 Seeding initial market datasets...');
        const logoData = loadLogoDesignSampleDataset();
        if (logoData) {
            saveDataset(logoData.id, {
                title: logoData.title,
                query: logoData.query,
                scrapeMode: logoData.scrapeMode
            }, logoData.items);
        }
        const webData = loadWebDevSampleDataset();
        if (webData) {
            saveDataset(webData.id, {
                title: webData.title,
                query: webData.query,
                scrapeMode: webData.scrapeMode
            }, webData.items);
        }
    }
}
seedSampleDatasets();

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// List datasets
app.get('/api/datasets', (req, res) => {
    try {
        const datasets = listDatasets();
        res.json({ datasets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get dataset by ID
app.get('/api/datasets/:id', (req, res) => {
    try {
        const dataset = getDataset(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
        res.json({ dataset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete dataset
app.delete('/api/datasets/:id', (req, res) => {
    try {
        const ok = deleteDataset(req.params.id);
        if (!ok) return res.status(404).json({ error: 'Dataset not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export dataset (CSV, JSON, or Raw)
app.get('/api/datasets/:id/export', (req, res) => {
    try {
        const dataset = getDataset(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

        const format = req.query.format || 'json';
        if (format === 'csv') {
            const csv = exportDatasetCSV(dataset.items);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="fiverr_${dataset.id}.csv"`);
            return res.send(csv);
        }

        if (format === 'raw') {
            const rawItems = dataset.items || [];
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="raw_fiverr_scraped_${dataset.id}.json"`);
            return res.send(JSON.stringify(rawItems, null, 2));
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="fiverr_${dataset.id}.json"`);
        res.json(dataset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Download 100% Pure Raw Scraped Data (Untouched JSON, zero math/modifications)
app.get('/api/datasets/:id/raw', (req, res) => {
    try {
        const dataset = getDataset(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

        const rawItems = dataset.items || [];
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="raw_fiverr_scraped_${dataset.id}.json"`);
        res.send(JSON.stringify(rawItems, null, 2));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Seed/Load sample dataset manually
app.post('/api/datasets/load-sample', (req, res) => {
    try {
        const type = req.body.type || 'logo';
        let sample = type === 'web' ? loadWebDevSampleDataset() : loadLogoDesignSampleDataset();
        if (!sample) return res.status(400).json({ error: 'Failed to generate sample' });

        const uniqueId = `${sample.id}-${Date.now().toString().slice(-4)}`;
        const saved = saveDataset(uniqueId, {
            title: sample.title,
            query: sample.query,
            scrapeMode: sample.scrapeMode
        }, sample.items);

        res.json({ success: true, dataset: saved });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Scrape Job
app.post('/api/scrape/start', (req, res) => {
    try {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const job = new ScrapeJob(jobId, req.body);
        activeJobs.set(jobId, job);

        // Auto-cleanup job from memory after 15 minutes
        const scheduleJobCleanup = () => {
            setTimeout(() => {
                if (activeJobs.has(jobId)) {
                    activeJobs.delete(jobId);
                }
            }, 15 * 60 * 1000);
        };
        job.once('done', scheduleJobCleanup);
        job.once('error', scheduleJobCleanup);
        job.once('stopped', scheduleJobCleanup);

        // Run asynchronously
        job.run().catch(err => console.error(`Job ${jobId} error:`, err));

        res.json({ success: true, jobId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stop Scrape Job
app.post('/api/scrape/stop/:id', (req, res) => {
    const job = activeJobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found or already finished' });
    job.stop();
    res.json({ success: true });
});

// Server-Sent Events (SSE) stream for live job progress
app.get('/api/scrape/stream/:id', (req, res) => {
    const job = activeJobs.get(req.params.id);
    if (!job) return res.status(404).send('Job not found');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send periodic SSE keep-alive ping to prevent proxy / browser timeouts
    const pingInterval = setInterval(() => {
        try {
            res.write(': ping\n\n');
        } catch {
            clearInterval(pingInterval);
        }
    }, 15000);

    const sendSSE = (event, data) => {
        try {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch (err) {
            console.error('SSE write error:', err.message);
        }
    };

    // Send existing logs
    for (const log of job.logs) {
        sendSSE('log', log);
    }

    const onLog = (log) => sendSSE('log', log);
    const onProgress = (progress) => sendSSE('progress', progress);
    const onItem = (item) => sendSSE('item', item);
    const onDone = (result) => {
        sendSSE('done', result);
        cleanup();
        res.end();
    };
    const onError = (err) => {
        sendSSE('error', { message: err.message });
        cleanup();
        res.end();
    };

    job.on('log', onLog);
    job.on('progress', onProgress);
    job.on('item', onItem);
    job.on('done', onDone);
    job.on('error', onError);

    const cleanup = () => {
        clearInterval(pingInterval);
        job.off('log', onLog);
        job.off('progress', onProgress);
        job.off('item', onItem);
        job.off('done', onDone);
        job.off('error', onError);
    };

    req.on('close', cleanup);
});

// Serve frontend build in production
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
        if (err) res.status(404).send('Client not built yet. Run client dev server.');
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Fiverr Scraper & Intelligence API running on http://localhost:${PORT}`);
});
