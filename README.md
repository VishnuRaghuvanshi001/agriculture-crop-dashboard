# 🌾 Indian Agriculture & Crop Production Intelligence Dashboard

An interactive, animated, and intelligence-driven web dashboard built with **Python, Streamlit, Pandas, and Plotly** to explore historical agricultural performance, spatial distributions, state profiles, and agronomic benchmarks across India (**1997–2020**).

---

## 📌 Project Overview & Objectives

Agriculture is fundamental to India's economy, yet crop productivity exhibits immense regional diversity shaped by agro-climatic zones, soil variations, seasonal monsoons, and irrigation infrastructure. 

This project bridges **historical agricultural records** (1997–2020 across 30 states and 55 crops) with **authentic agronomic science** from research institutions including:
- **ICAR** (Indian Council of Agricultural Research)
- **NBSS&LUP** (National Bureau of Soil Survey and Land Use Planning)
- **DES** (Directorate of Economics and Statistics, Ministry of Agriculture & Farmers Welfare)
- **TNAU** (Tamil Nadu Agricultural University Agritech Portal)
- **FAO** (Food and Agriculture Organization - Land & Water)

> **Analytical Scope Note:**  
> This dashboard is strictly a **descriptive and exploratory intelligence platform** based on historical observational records and established agronomic science. It **does not forecast future crop yields or make speculative machine learning predictions**.

---

## 🌟 Key Dashboard Features

### 1. 🗺️ Interactive India Map & Spatial Intelligence
- **Authentic Boundaries:** Utilizes real Survey of India administrative boundaries via verified GeoJSON (`data/india_states.geojson`).
- **Metric Selection:** Map states by **Total Production**, **Average Yield**, **Cultivated Area**, or **Annual Rainfall (mm)**.
- **Animated Historical Playback:** Built-in **Play/Pause controls** and a draggable Year Slider that animates state-wise production shifts from 1997 to 2020.
- **State Drilldown Synchronization:** Selecting any state on the map automatically prepares it for deep exploration in the State Explorer tab.

### 2. 📍 State Agricultural Explorer
- **Soil & Climate Intelligence:** Displays official **ICAR-NBSS&LUP** primary soil classifications (Alluvial, Black/Regur, Red Sandy, Laterite, etc.) and Planning Commission Agro-Climatic Zones.
- **State Rankings:** Bar charts showing the top 10 cultivated crops in the selected state.
- **Historical Trajectory:** Dual-axis visualization comparing historical production trends against precipitation over time.
- **Crop Suitability Matrix:** Table matching state crops against optimal water needs, temperature thresholds, and maturity durations.

### 3. 🌱 Crop Intelligence & Lifecycle Visualizer
- **Searchable Crop Intelligence (55 Crops):** In-depth agronomic profile including optimal temperature (°C), water need (mm), maturity days, and recommended soils.
- **Interactive Lifecycle Stage Progression:** Step-by-step visualizer breaking down crop growth into distinct phases (e.g. *Sowing/Nursery $\rightarrow$ Vegetative/Tillering $\rightarrow$ Panicle/Flowering $\rightarrow$ Ripening/Harvest*) with progress tracking and field management notes.
- **Water Need vs. Rainfall Comparison:** Compares crop water needs against the actual average precipitation in its top-producing states, highlighting the critical role of canal and tubewell irrigation.

### 4. 📊 National Production Analytics & Trends
- **Comparative Visualizations:** Sorted horizontal and vertical bar charts, time-series line charts, and Top 10 state rankings.
- **Year-over-Year (YoY) Growth Rate:** Annual percentage change analysis with color-coded positive (green) and negative (red) growth indicators.
- **Rainfall vs. Yield Correlation:** Scatter plot with Pearson correlation coefficient ($r$), protected against zero variance and low-sample edge cases.
- **Automated Insights:** Dynamic detection of crop market dominance share (%), leading state, and multi-year trajectory.

### 5. 🔍 Data Quality & Unit Awareness
- **Coconut Reporting Discrepancy:** Coconuts are officially measured in **individual nuts / thousands of nuts**, whereas grains are reported in **metric tonnes**. A dedicated **Crop Classification** filter prevents cross-commodity distortion.
- **2020 Reporting Cutoff:** Transparently explains why the dataset shows a sharp drop in 2020 (only Uttarakhand reported figures in the collection for that year).

### 6. 📋 Data Table & CSV Export
- Interactive table supporting column inspection and one-click **Download Filtered Data as CSV**.

---

## 🛠️ Technology Stack

| Technology | Role |
| :--- | :--- |
| **Python 3.11** | Core application logic and data pipelines |
| **Streamlit** | Modern, responsive web framework with session-state reactivity |
| **Pandas** | High-performance data cleaning, multi-dimensional filtering, and aggregation |
| **Plotly Express & Graph Objects** | Interactive choropleth maps, time-series lines, and animated charts |
| **NumPy** | Statistical operations and Pearson correlation calculations |
| **Git & GitHub** | Source code version control |

---

## 📁 Project Structure

```text
Agriculture_dashboard/
├── .streamlit/
│   └── config.toml          # Custom agricultural green palette and UI theme
├── data/
│   └── india_states.geojson # Authentic GeoJSON boundary definitions (36 states/UTs)
├── agronomy_data.py         # ICAR & NBSS&LUP agronomic reference profiles
├── app.py                   # Main Streamlit intelligence dashboard
├── crop_yield.csv           # Historical Indian crop production records (19,689 rows)
├── requirements.txt         # Pinned Python package dependencies
├── test_app_logic.py        # Automated test suite for calculations & GeoJSON mapping
├── .gitignore               # Exclusions for Python bytecode and caches
└── README.md                # Project documentation and presentation guide
```

---

## 🚀 Running the Project Locally

### 1. Prerequisites
Ensure Python 3.10+ is installed on your computer.

### 2. Navigate to Project Directory
```powershell
cd d:\Agriculture_dashboard
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Run the Automated Test Suite
```powershell
python test_app_logic.py
```

### 5. Launch the Intelligence Dashboard
```powershell
streamlit run app.py
```
Open your browser at `http://localhost:8501`.

---

## 🌐 Online Deployment (Streamlit Community Cloud)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add interactive map, state explorer, and crop lifecycle visualizer"
   git push origin main
   ```
2. **Deploy via Streamlit Community Cloud:**
   - Sign in to [share.streamlit.io](https://share.streamlit.io) with GitHub.
   - Click **New app**, select your repository, set the main file path to `app.py`, and click **Deploy**.
