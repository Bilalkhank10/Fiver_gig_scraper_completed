# GigRadar 🎯 — Fiverr Market Intelligence & Scraper Suite

A premium, full-featured web application and scraper engine built on top of the Fiverr Gig Scraper. Transforms raw gig scraping into an actionable **Market Intelligence, Competitor Analysis, and Lead Generation Suite**.

![GigRadar Screenshot](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80)

---

## ✨ Features

- **⚡ Real-Time Scraper Hub**:
  - Live Server-Sent Events (SSE) telemetry log console with colored status levels and animated progress bar.
  - Three scraping modes:
    - `Search Listing`: Fast 48 gigs per page with organic & ad position tracking.
    - `Deep Search + Details`: Crawls search results, then opens every individual gig page to extract all 3 package tiers, reviews, and seller dossiers.
    - `Direct URL List`: Target specific gig URLs directly.
  - Configurable parameters: Page counts (1-50), Sort options (Rating, New, Price Asc/Desc), Skip promoted ads, Deduplicate gigs, and Jina AI fallback.
  - **Instant Demo Mode**: Built-in benchmark generator for instantaneous exploration without needing proxies.

- **📊 Market Intelligence & Analytics Dashboard**:
  - Executive KPI cards: Total Gigs, Average Price, Median Price, Turnaround Days, Promoted Ad %, Choice Badges.
  - Interactive Recharts Visualizations:
    - **Price Tier Clustering**: Histogram across brackets ($0-$25, $25-$50, $50-$100, $100-$250, $250+).
    - **Seller Level Demographics**: Donut chart of Top Rated, Level 2, Level 1, and New Sellers.
    - **Geographic Origins**: Horizontal bar chart of seller countries.
    - **Turnaround Windows**: Delivery speed distribution.
    - **Keyword & Style Tag Cloud**: Frequency counter of top-ranking tags.

- **🔎 Interactive Gig Explorer**:
  - Dual view modes: **Card Grid View** (rich visual cards with badges and avatars) and **Data Table View** (dense, sortable table).
  - Multi-faceted filters: Search keywords, Price range slider, Seller level pills, Country, Promoted/Organic toggle, and Fiverr's Choice filter.
  - Quick action to open deep gig dossiers or add to comparison tray.

- **📋 Deep Gig Dossier (Detail Modal)**:
  - High-resolution gallery carousel with thumbnail strips.
  - Full **3-tier package comparison** (Basic, Standard, Premium) showing prices, delivery times, revisions, and feature checkmarks.
  - Comprehensive seller profile: avatar, country, member since, bio, response time, completed orders count, languages, and skills.
  - Star ratings breakdown & buyer testimonials with seller response quotes.
  - FAQ accordion and metadata tags.

- **⚖️ Competitive Comparison Matrix**:
  - Select 2 to 4 gigs to compare side-by-side in a comparative scorecard.

- **💾 Dataset Manager & Multi-Format Export**:
  - Archive of past scraping runs stored locally in `.data/datasets/`.
  - One-click export to **CSV Spreadsheet**, **Structured JSON**, or **Markdown Report**.
  - One-click clipboard copy.

---

## 🚀 Quick Start

### 1. Run Development Server (Both Frontend & Backend)
```bash
npm run dev
```
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API & SSE Engine:** [http://localhost:5000](http://localhost:5000)

### 2. Run Backend Only
```bash
npm run server
```

### 3. Run Frontend Only
```bash
npm run client
```

### 4. Build and Run Production
```bash
npm run build
npm start
```
The production server serves both the API endpoints and the compiled frontend single-page application at [http://localhost:5000](http://localhost:5000).

---

## 📁 Project Structure

```
FIVER_SCRAPER/
├── client/                     # Modern React + Vite + Tailwind + Recharts frontend
│   ├── src/
│   │   ├── components/         # Navbar, ScraperHub, AnalyticsView, GigExplorer,
│   │   │                       # GigCard, GigDetailModal, ComparisonMatrix, ExportModal, etc.
│   │   ├── services/api.js     # REST and SSE client service
│   │   └── App.jsx             # Main application orchestrator
│   └── package.json
│
├── server/                     # Node Express API & SSE streaming engine
│   ├── server.js               # API routes and SSE endpoints
│   ├── scraperEngine.js        # Streaming scraper job runner
│   ├── datasetManager.js       # Dataset JSON storage and analytics aggregator
│   ├── sampleData.js           # Built-in benchmark datasets
│   └── package.json
│
├── fiverr-gig-scraper-main/    # Original scraper codebase (preserved intact)
│   └── fiverr-gig-scraper-main/
│       ├── src/                # parser.js, gigDetail.js, main.js
│       └── test/               # Sample HTML and unit tests
│
├── run-dev.js                  # One-click dev launcher
└── package.json                # Root package configuration
```
