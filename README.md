# 🌾 AGRI-INTELLIGENCE // National Agronomic Command Center for India

An industry-grade, animated agricultural intelligence web platform combining **historical crop production records (1997–2020)** with **ICAR & NBSS&LUP agronomic science**, **Open-Meteo live 2026 satellite meteorology**, and a **cyberpunk glassmorphism web interface (React 19 + Vite)**.

---

## 📌 Project Overview

Agriculture is the backbone of India's economy, yet yield and crop suitability vary drastically across agro-climatic zones, soil classifications, and seasonal rainfall distributions.

This platform delivers an interactive command center bridging **19,689 real-world agricultural observations** across **30 Indian States/UTs** and **55 crops** with authoritative agronomic science:
- **ICAR** (Indian Council of Agricultural Research)
- **NBSS&LUP** (National Bureau of Soil Survey and Land Use Planning)
- **DES** (Directorate of Economics and Statistics, Ministry of Agriculture & Farmers Welfare)
- **TNAU** (Tamil Nadu Agricultural University Agritech Portal)
- **Open-Meteo Global WMO** (Real-time live 2026 satellite meteorological feed)

---

## 🚀 Key Features

### 1. ⚡ Cyberpunk Glassmorphic Dashboard
- **Visuals:** Credit-card style KPI cards, glowing yearly inflow bar charts, commodity donuts, agronomic radar, and rainfall spline wave.
- **1-Click "Exclude Coconut (Tonnes Only)" Toggle:** Solves the national reporting discrepancy where Coconut is recorded in *nuts* (308 Billion) while food crops are measured in *metric tonnes* (Rice: 2.2B MT, Wheat: 1.8B MT).
- **Multi-Theme Engine:** Seamless switching between Cyberpunk Dark, Slate Neumorphic, and Clean Light.
- **Micro-Interaction Sound Synthesizer:** Web Audio API procedural audio with mute/unmute control.

### 2. 🗺️ Survey of India Spatial Cartography
- **Survey of India SVG Boundaries:** Official administrative boundaries rendered with hardware-accelerated D3-Geo projections.
- **1997–2020 Animated Timeline Scrubber:** Auto-play and manual scrubbing through 24 years of state-wise production shifts.
- **Heatmaps & Tooltips:** Choropleths for Production, Mean Yield, and Annual Rainfall with 1-click drill-down to State Explorer.

### 3. 📍 State Explorer & Live 2026 Satellite Weather Feed
- **Live 2026 Weather Integration:** Connects to Open-Meteo API for all 30 state capitals (ambient temperature, humidity, precipitation, and surface wind speed).
- **Automated Agro-Advisories:** Dynamic notices generated in real time (e.g. *Optimal Field Conditions*, *Pathogen / Humidity Vigilance*, *Thermal Evapotranspiration Stress*).
- **Soil Taxonomy (ICAR-NBSS&LUP):** Dominant regional soils (Alluvial Loam, Black Regur, Red Sandy Loam, Laterite, etc.) and Planning Commission agro-climatic zones.

### 4. 🔮 ICAR Feasibility Simulator & Recommendation Engine
- **Algorithmic Matching Engine:** Evaluates soil suitability, water availability (mm), temperature range (°C), and season against 55 ICAR crop profiles.
- **Match Score & Confetti:** Generates feasibility percentages (0–100%) and instant recommendations for maximum harvest yield.

### 5. ⚔️ Head-to-Head Crop Battle (Resource Efficiency Comparator)
- **Side-by-Side Radar:** Compares any two crops on Water Economy, Heat Resilience, Harvest Speed, Yield Potential, and Soil Adaptability.
- **Water Savings Metric:** Demonstrates critical crop diversification tradeoffs (e.g., Rice vs. Millets/Bajra saving up to 67% irrigation water).

### 6. 🌱 Crop Intelligence & 4-Stage Lifecycle Progression
- **55 Crops:** Searchable database with duration days, reporting units, and optimal temperature/water windows.
- **Interactive Lifecycle Visualizer:** 4-stage biological progression (*Germination $\rightarrow$ Vegetative $\rightarrow$ Flowering/Filling $\rightarrow$ Physiological Ripeness*) with management guidelines.

### 7. 📋 Filterable Data Table & CSV Export
- Search and filter records by State, Crop, or Category with one-click CSV download.

### 8. 🤖 Krishi AI // Cognitive Agronomist (Groq LPU Copilot)
- **Ultra-Fast LLM Inference:** Powered by Groq Cloud API with real-time SSE streaming (280–750 tokens/sec) using `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.
- **In-Memory Agronomic RAG:** Injects authentic ICAR water requirements, temperature ranges, NBSS&LUP soil types, and active dashboard context (inspected state, crop, and Coconut toggle state) into the reasoning loop.
- **Floating Quick-Access Widget:** Integrated across all views (Dashboard, Spatial Map, Feasibility Simulator, Crop Battle) for seamless, context-aware queries.
- **Zero-Friction Privacy:** Client-side only API key storage (`localStorage` / `.env.local`), requiring no extra backend processes to run.

---

## 🛠️ Technology Stack

| Layer | Technologies | Role |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, Vite 8 | Fast, modern client-side rendering & component architecture |
| **Styling & Effects** | Tailwind CSS, Framer Motion | 60 FPS animated dark glassmorphic UI & transitions |
| **Data Visualization** | Recharts, D3-Geo | Hardware-accelerated SVG cartography, radars, donuts, and spline charts |
| **Live Telemetry** | Open-Meteo Global WMO Satellite API | Real-time 2026 meteorological feed for 30 state capitals |
| **Cognitive AI Copilot** | Groq Cloud LPU (Llama 3.3 70B & 3.1 8B) | Ultra-fast streaming LLM inference with ICAR domain RAG |
| **Audio Synthesis** | Web Audio API | Procedural synthesizer for micro-interaction sounds |
| **Data Pipeline** | Python 3.11, Pandas, NumPy | Pre-aggregates 19,689 rows into dual-slice JSON (`agri_data.json`) |

---

## 📁 Repository Structure

```text
agriculture-crop-dashboard/
├── data/
│   └── india_states.geojson      # Verified Survey of India administrative boundaries
├── frontend/                     # React 19 + Vite Web Application
│   ├── public/
│   │   ├── favicon.svg           # Custom SVG favicon
│   │   └── icons.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Dynamic navigation, theme & coconut toggle
│   │   │   ├── DashboardView.jsx     # Cyberpunk KPI cards, charts, spline wave
│   │   │   ├── SpatialMapView.jsx    # D3-Geo SVG map with timeline playback
│   │   │   ├── StateExplorerView.jsx # State taxonomy & Live 2026 weather feed
│   │   │   ├── CropIntelligenceView.jsx # 55 crops & 4-stage lifecycle visualizer
│   │   │   ├── CropSimulatorView.jsx # ICAR predictive feasibility simulator
│   │   │   ├── CropBattleView.jsx    # Head-to-head resource efficiency comparator
│   │   │   ├── DataTableView.jsx     # Searchable records & instant CSV export
│   │   │   ├── ChatbotView.jsx       # Krishi AI Copilot (Groq LPU streaming interface)
│   │   │   ├── FloatingChatWidget.jsx# Global quick-access floating assistant
│   │   │   └── MarkdownRenderer.jsx  # Cyberpunk rich markdown & table formatter
│   │   ├── services/
│   │   │   ├── groqService.js        # Groq REST API client & SSE streaming reader
│   │   │   └── agriPromptContext.js  # Grounding ICAR knowledge base & prompt builder
│   │   ├── data/
│   │   │   ├── agri_data.json        # Pre-calculated dual-slice metrics (with/without coconut)
│   │   │   └── india_states.json     # Cartography GeoJSON bundle
│   │   ├── App.jsx                   # Central state machine & view router
│   │   ├── soundEffects.js           # Web Audio API procedural synthesizer
│   │   ├── stateCapitals.js          # Lat/Lon coordinates for 30 state capitals
│   │   ├── utils.js                  # Number formatters & helpers
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── crop_yield.csv                # Historical production dataset (19,689 rows, 1997–2020)
├── agronomy_data.py              # Authentic ICAR & NBSS&LUP crop and soil profiles
├── export_frontend_data.py       # Data pipeline exporting optimized JSON for React
├── package.json                  # Root npm configuration (1-step npm run dev)
├── .gitignore                    # Exclusions for node_modules, dist, and pycache
└── README.md                     # Documentation
```

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch the Application
```bash
npm run dev
```
👉 Open browser at: **`http://localhost:3000`**

### 3. Optional: Configure Krishi AI (Groq Cloud LLM)
1. Get a free API key in 30 seconds at [console.groq.com/keys](https://console.groq.com/keys) (no credit card required).
2. Either paste the key directly in the web app under the **"Krishi AI"** tab, or create a `frontend/.env.local` file:
   ```env
   VITE_GROQ_API_KEY=gsk_your_groq_key_here
   ```

---

## 💻 Running on Another Device or Local Network

### 1. Prerequisites on the New Device
- **Node.js** (v18 or higher) & npm — [Download from nodejs.org](https://nodejs.org/)
- **Git** (if cloning via GitHub)
- *(Optional)* **Python 3.10+**: Only required if you intend to re-process `crop_yield.csv` using `export_frontend_data.py`. The dashboard runs standalone with pre-bundled datasets (`agri_data.json` & `india_states.json`).

### 2. Setup Steps on the New Machine
```bash
# 1. Clone or copy the repository
git clone <your-repo-url>
cd agriculture-crop-dashboard

# 2. Install dependencies
npm install

# 3. Start the application
npm run dev
```
👉 Open browser at: **`http://localhost:3000`**

### 3. Setting Up Krishi AI (Groq LLM)
- **Option A (In-App UI — Recommended):** Launch the dashboard, open the **Krishi AI** tab, click **"Set Groq Key"**, and paste your free key from [console.groq.com/keys](https://console.groq.com/keys). It is saved locally in that browser.
- **Option B (Pre-configure via environment variable):** Create `frontend/.env.local`:
  ```env
  VITE_GROQ_API_KEY=gsk_your_groq_key_here
  ```

### 4. Accessing from Mobile / Tablet / Laptop on the Same Wi-Fi
The Vite dev server is pre-configured with `host: true`. When you run `npm run dev`, check your terminal for the Network URL:
```text
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```
Enter the `http://192.168.x.x:3000` address in the browser of any phone, tablet, or secondary laptop connected to the same Wi-Fi network.

### 5. Production Cloud Deployment (Vercel / Netlify)
To host the platform online for public access:
1. Push your code to GitHub.
2. Import the repository into **Vercel** or **Netlify**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**: `VITE_GROQ_API_KEY` = `gsk_...`
3. Click **Deploy**. The platform and Krishi AI will be live on a public URL with zero server maintenance.

---

## 🔬 Scientific & Institutional Citations
- **ICAR:** Indian Council of Agricultural Research (*Handbook of Agriculture, 6th Edition*)
- **NBSS&LUP:** National Bureau of Soil Survey & Land Use Planning (Soils of India Series)
- **DES:** Directorate of Economics and Statistics, Ministry of Agriculture & Farmers Welfare
- **TNAU:** Tamil Nadu Agricultural University Agritech Portal (Crop Production Guide)
- **FAO:** Food and Agriculture Organization (*Irrigation and Drainage Paper No. 56 / 33*)
- **Open-Meteo:** Global Meteorological Organization open-access satellite weather API
