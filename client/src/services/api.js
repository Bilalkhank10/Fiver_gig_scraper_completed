const API_BASE = '/api';

export async function fetchDatasets() {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error('Failed to load datasets');
  const data = await res.json();
  return data.datasets || [];
}

export async function fetchDataset(id) {
  const res = await fetch(`${API_BASE}/datasets/${id}`);
  if (!res.ok) throw new Error(`Failed to load dataset ${id}`);
  const data = await res.json();
  return data.dataset;
}

export async function deleteDataset(id) {
  const res = await fetch(`${API_BASE}/datasets/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete dataset');
  return res.json();
}

export async function loadSampleDataset(type = 'logo') {
  const res = await fetch(`${API_BASE}/datasets/load-sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  if (!res.ok) throw new Error('Failed to load sample dataset');
  const data = await res.json();
  return data.dataset;
}

export async function startScrape(config) {
  const res = await fetch(`${API_BASE}/scrape/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to start scrape');
  return res.json();
}

export async function stopScrape(jobId) {
  const res = await fetch(`${API_BASE}/scrape/stop/${jobId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to stop scrape');
  return res.json();
}

export function subscribeScrapeStream(jobId, { onLog, onProgress, onItem, onDone, onError }) {
  const eventSource = new EventSource(`${API_BASE}/scrape/stream/${jobId}`);

  eventSource.addEventListener('log', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onLog) onLog(data);
    } catch (err) {
      console.error('Log parse error:', err);
    }
  });

  eventSource.addEventListener('progress', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onProgress) onProgress(data);
    } catch (err) {
      console.error('Progress parse error:', err);
    }
  });

  eventSource.addEventListener('item', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onItem) onItem(data);
    } catch (err) {
      console.error('Item parse error:', err);
    }
  });

  eventSource.addEventListener('done', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onDone) onDone(data);
    } catch (err) {
      console.error('Done parse error:', err);
    }
    eventSource.close();
  });

  eventSource.addEventListener('error', (e) => {
    try {
      const data = e.data ? JSON.parse(e.data) : { message: 'Connection interrupted' };
      if (onError) onError(data);
    } catch {
      if (onError) onError({ message: 'Stream connection error' });
    }
    eventSource.close();
  });

  return () => {
    eventSource.close();
  };
}

export function getExportUrl(datasetId, format = 'csv') {
  return `${API_BASE}/datasets/${datasetId}/export?format=${format}`;
}

export function getRawExportUrl(datasetId) {
  return `${API_BASE}/datasets/${datasetId}/raw`;
}
