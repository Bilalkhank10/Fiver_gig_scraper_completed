# GigRadar MCP Server 🎯

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes the **GigRadar Fiverr Market Intelligence & Scraper Suite** as AI-callable tools.

Connect this to **Claude Desktop**, **Antigravity**, **Cursor**, or any MCP-compatible client to give your AI assistant the ability to scrape Fiverr, analyze market data, compare sellers, and export reports — all via natural language.

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `scrape_fiverr` | Run a Fiverr scrape job (search, deep, or demo mode) |
| `list_datasets` | List all saved scraping datasets |
| `get_dataset` | Retrieve a full dataset by ID with pagination |
| `get_market_analytics` | Get comprehensive analytics (pricing, seller demographics, countries, tags) |
| `search_gigs` | Filter & search gigs by keyword, price, seller level, country |
| `compare_gigs` | Compare 2–5 gigs side-by-side with value scoring |
| `export_dataset` | Export a dataset to CSV, JSON, or Markdown report |
| `delete_dataset` | Delete a saved dataset |
| `load_sample_dataset` | Load a built-in demo dataset for instant exploration |

---

## 🚀 Setup

### 1. Install Dependencies

```bash
cd mcp-server
npm install
```

### 2. Test It Locally

```bash
node index.js
```

The server communicates via **stdio** (stdin/stdout), so it will appear to hang — that's expected. It's waiting for MCP protocol messages.

### 3. Connect to Your AI Client

#### Claude Desktop

Add this to your `claude_desktop_config.json` (located at `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "gigradar": {
      "command": "node",
      "args": ["C:/Users/YOUR_USERNAME/Desktop/FIVER_SCRAPER/mcp-server/index.js"]
    }
  }
}
```

#### Antigravity (AGY)

Add this to your `.gemini/settings.json` or workspace config:

```json
{
  "mcpServers": {
    "gigradar": {
      "command": "node",
      "args": ["C:/Users/YOUR_USERNAME/Desktop/FIVER_SCRAPER/mcp-server/index.js"]
    }
  }
}
```

#### Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gigradar": {
      "command": "node",
      "args": ["C:/Users/YOUR_USERNAME/Desktop/FIVER_SCRAPER/mcp-server/index.js"]
    }
  }
}
```

> **Note:** Replace `YOUR_USERNAME` with your actual Windows username and adjust the path as needed.

---

## 💬 Example Prompts

Once connected, you can ask your AI things like:

- *"Load a sample Fiverr dataset and analyze the market"*
- *"Scrape Fiverr for logo design gigs and show me the price distribution"*
- *"Search the dataset for sellers in Pakistan with prices under $50"*
- *"Compare the top 3 rated gigs side by side"*
- *"Export the results as a CSV"*
- *"What's the average price for logo design on Fiverr?"*
- *"Show me the market analytics for the latest scrape"*

---

## 📁 Architecture

```
mcp-server/
├── index.js         # MCP server — tool definitions & handlers
├── package.json     # Dependencies (@modelcontextprotocol/sdk)
└── README.md        # This file

↕ Imports from existing server/:
├── server/
│   ├── scraperEngine.js    # Scrape job runner
│   ├── datasetManager.js   # Dataset CRUD & analytics
│   └── sampleData.js       # Built-in benchmark data
```

The MCP server reuses the existing backend modules directly — **no duplication**. Datasets saved by the MCP server are the same `.data/datasets/*.json` files used by the web UI, so they're fully interoperable.
