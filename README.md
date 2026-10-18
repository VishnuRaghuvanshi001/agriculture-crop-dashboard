# 🌾 Agriculture and Crop Production Dashboard

An interactive, data-driven web dashboard built from scratch to explore, analyze, and visualize historical agricultural patterns across Indian states, crops, seasons, and years (**1997–2020**).

---

## 📌 Project Overview & Problem Statement

Agriculture constitutes the backbone of India's socioeconomic landscape, employing a substantial portion of the population. However, agricultural output is subject to intense regional, seasonal, and temporal variations driven by weather fluctuations, geographical diversity, and crop selection. 

Understanding historical production figures, crop dominance, and rainfall patterns is critical for students, researchers, policy planners, and agronomists.

**This project addresses this need by providing an accessible, interactive exploration tool** that transforms raw multi-decade historical records into clear, actionable visual insights.

> **Important Analytical Scope:**  
> This dashboard is strictly a **descriptive and exploratory data visualization project** based on historical observational records. It **does not predict future crop yields or production**, nor does it make claims of machine learning forecasting.

---

## 🎯 Objectives

1. **Interactive Data Filtering:** Enable granular exploration across 24 harvest years (1997–2020), 55 distinct crops, 30 Indian states/UTs, and 6 agricultural seasons.
2. **Key Performance Indicators (KPIs):** Dynamically summarize cumulative production, average yield, active states, and crop varieties based on user-selected criteria.
3. **Comparative Crop & State Analysis:** Highlight leading agricultural outputs, rank top-producing states, and examine commodity shares.
4. **Temporal Trajectory & Growth Tracking:** Visualize yearly production changes and compute Year-over-Year (YoY) percentage growth rates.
5. **Rainfall vs. Yield Correlation:** Statistically evaluate the Pearson correlation coefficient between annual rainfall and crop yield while highlighting the agronomic principle that *correlation does not imply causation*.
6. **Data Accessibility:** Provide a searchable data inspection table and instant one-click CSV export of filtered records.

---

## 🛠️ Technologies Used

| Technology | Purpose |
| :--- | :--- |
| **Python 3.11** | Core application logic and data processing |
| **Pandas** | High-performance data ingestion, cleaning, multi-dimensional filtering, and aggregation |
| **Streamlit** | Modern, responsive web interface, filter state management, and real-time dashboard reactivity |
| **Plotly Express & Graph Objects** | Interactive, publication-ready charts with custom tooltips, zoom, and responsive resizing |
| **NumPy** | Statistical operations, variance checks, and Pearson correlation edge-case calculations |
| **Git & GitHub** | Source-code version control |
| **Streamlit Community Cloud** | Online deployment and continuous web hosting |

---

## 📊 Dataset Description

The dataset (`crop_yield.csv`) aggregates historical agricultural records across Indian states spanning 1997 to 2020:

| Column | Data Type | Description |
| :--- | :--- | :--- |
| `Crop` | Categorical | Specific agricultural crop name (e.g., Rice, Wheat, Arecanut, Coconut) |
| `Crop_Year` | Integer | Calendar year of harvest (1997 to 2020) |
| `Season` | Categorical | Agricultural season (`Kharif`, `Rabi`, `Whole Year`, `Summer`, `Autumn`, `Winter`) |
| `State` | Categorical | Indian state or Union Territory |
| `Area` | Numeric | Cultivated land area |
| `Production` | Numeric | Total recorded production volume |
| `Annual_Rainfall` | Numeric | Recorded average annual precipitation in millimeters (mm) |
| `Fertilizer` | Numeric | Fertilizer quantity recorded for the cultivation area |
| `Pesticide` | Numeric | Pesticide quantity applied |
| `Yield` | Numeric | Calculated production efficiency |

### Measurement Units Note
In national agricultural databases, crops are reported under different statistical standards (e.g., coconut is traditionally tallied in nuts/thousands of nuts, whereas food grains and oilseeds are tabulated in metric tonnes or quintals). Rather than inventing false conversions across dissimilar commodities, this dashboard preserves academic accuracy by using truthful, neutral labels (**Production** and **Yield**).

---

## 📁 Project Structure

```text
Agriculture_dashboard/
├── .streamlit/
│   └── config.toml          # Custom agricultural color palette and layout theme
├── app.py                   # Main Streamlit dashboard source code
├── crop_yield.csv           # Historical Indian crop production dataset (19,689 rows)
├── requirements.txt         # Pinned Python package dependencies
├── test_app_logic.py        # Automated test suite for calculations & edge cases
└── README.md                # Project documentation and presentation guide
```

---

## 🌟 Key Dashboard Features

1. **Header & Context:** Introduces the project scope and historical context.
2. **Dynamic Sidebar Filters:**
   - Multi-year slider (1997–2020)
   - Multi-select dropdowns for Crops, States, and Seasons with instant **Select All** and **Clear** helpers
   - Global **Reset All Filters** button
3. **KPI Cards:**
   - Total Production (formatted with concise unit suffixes e.g., M, B, K)
   - Mean Yield
   - Active States count
   - Active Crops count
4. **Production by Crop:** Descending bar chart with smart auto-capping at top 20 crops for high readability.
5. **Yearly Production Trend:** Chronological time-series line chart with discrete year markers and unified tooltips.
6. **Top 10 States Ranking:** Horizontal bar chart sorting leading agricultural producer states.
7. **Automated Agricultural Insights:** Dynamic textual findings highlighting leading crops, production share percentage, top state, and overall multi-year trajectory.
8. **Rainfall vs. Yield Analysis:**
   - Scatter plot linking precipitation (mm) with crop yield
   - Pearson correlation coefficient calculation ($r$) with edge-case protection against zero variance
   - Scientific disclaimer on correlation vs. causation in agriculture
9. **Year-over-Year (YoY) Growth:** Percentage growth bar chart with color-coded positive (green) and negative (red) change indicators.
10. **Data Inspection & CSV Export:** Expandable data table with a dedicated **Download Filtered Data as CSV** button.

---

## 🚀 How to Run the Project Locally

### 1. Prerequisites
Ensure you have Python 3.10+ installed.

### 2. Clone or Navigate to the Project Directory
```powershell
cd d:\Agriculture_dashboard
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Run the Verification Test Suite
```powershell
python test_app_logic.py
```

### 5. Launch the Streamlit Dashboard
```powershell
streamlit run app.py
```

The application will launch in your default web browser at `http://localhost:8501`.

---

## 🌐 Deploying to Streamlit Community Cloud

Deploying this dashboard online is free and straightforward:

1. **Push the project to GitHub:**
   ```bash
   git init
   git add app.py crop_yield.csv requirements.txt README.md .streamlit/config.toml
   git commit -m "Initial commit of Agriculture and Crop Production Dashboard"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Connect to Streamlit Community Cloud:**
   - Visit [share.streamlit.io](https://share.streamlit.io) and sign in with your GitHub account.
   - Click **New app**.
   - Select your repository, branch (`main`), and set the main file path to `app.py`.
   - Click **Deploy!**

Your dashboard will be publicly accessible worldwide via a dedicated URL.

---

## ⚠️ Limitations of the Analysis

- **Historical Scope:** Data reflects recorded figures between 1997 and 2020; recent technological and climatic shifts after 2020 are not represented.
- **Observational Nature:** Calculations demonstrate historical associations. Rainfall alone does not determine yield; factors such as soil micronutrients, irrigation access, pest outbreaks, seed quality, and temperature extremes play foundational roles.
- **Reporting Units:** Because commodities vary in statistical units across state reporting boards, cross-commodity volume comparisons should be interpreted with awareness of commodity-specific reporting standards.
