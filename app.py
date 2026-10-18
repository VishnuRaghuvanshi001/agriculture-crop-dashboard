"""
Agriculture and Crop Production Dashboard
==========================================
An interactive web dashboard for exploring historical agricultural data across
Indian states, crops, seasons, and years (1997-2020).

Built with: Streamlit, Pandas, Plotly.
"""

import os
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# ==============================================================================
# 1. PAGE CONFIGURATION & THEME STYLING
# ==============================================================================
st.set_page_config(
    page_title="Agriculture & Crop Production Dashboard",
    page_icon="🌾",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for polished typography, badges, and card containers
st.markdown(
    """
    <style>
    /* Card containers for KPIs and Insights */
    .metric-card {
        background-color: #FFFFFF;
        border: 1px solid #E0E7DD;
        border-radius: 10px;
        padding: 16px 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        margin-bottom: 15px;
    }
    .metric-title {
        color: #4A5568;
        font-size: 0.88rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
    }
    .metric-value {
        color: #1B3B1B;
        font-size: 1.8rem;
        font-weight: 700;
        margin: 0;
    }
    .metric-subtitle {
        color: #718096;
        font-size: 0.8rem;
        margin-top: 4px;
    }
    .insight-box {
        background-color: #F1F8F1;
        border-left: 4px solid #2E7D32;
        border-radius: 6px;
        padding: 14px 18px;
        margin-bottom: 12px;
        color: #1F3A1F;
        font-size: 0.95rem;
    }
    .notice-box {
        background-color: #FFFDE7;
        border-left: 4px solid #FBC02D;
        border-radius: 6px;
        padding: 12px 16px;
        font-size: 0.88rem;
        color: #5D4037;
        margin-top: 10px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ==============================================================================
# 2. DATA LOADING & VALIDATION
# ==============================================================================
EXPECTED_COLUMNS = [
    "Crop",
    "Crop_Year",
    "Season",
    "State",
    "Area",
    "Production",
    "Annual_Rainfall",
    "Fertilizer",
    "Pesticide",
    "Yield",
]


@st.cache_data
def load_and_validate_data(filepath: str) -> pd.DataFrame:
    """
    Loads crop_yield.csv, validates the presence of expected columns,
    cleans whitespace in categorical fields, and parses numeric data types.
    """
    if not os.path.exists(filepath):
        st.error(
            f"Dataset not found at: `{filepath}`. "
            "Please ensure that `crop_yield.csv` is placed in the project directory."
        )
        st.stop()

    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        st.error(f"Error reading `{filepath}`: {e}")
        st.stop()

    # Validate column presence
    missing_cols = [col for col in EXPECTED_COLUMNS if col not in df.columns]
    if missing_cols:
        st.error(
            f"Dataset schema mismatch! Missing required columns: {', '.join(missing_cols)}"
        )
        st.stop()

    # Clean text columns (strip accidental leading/trailing spaces)
    text_cols = ["Crop", "Season", "State"]
    for col in text_cols:
        df[col] = df[col].astype(str).str.strip()

    # Ensure numeric types are strictly coerced
    numeric_cols = [
        "Crop_Year",
        "Area",
        "Production",
        "Annual_Rainfall",
        "Fertilizer",
        "Pesticide",
        "Yield",
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Drop any rows with NaN created by invalid records if any
    df = df.dropna(subset=EXPECTED_COLUMNS)
    df["Crop_Year"] = df["Crop_Year"].astype(int)

    return df


# ==============================================================================
# 3. HEADER SECTION
# ==============================================================================
def render_header():
    """Renders the top dashboard title and introduction banner."""
    col1, col2 = st.columns([0.88, 0.12])
    with col1:
        st.title("🌾 Agriculture and Crop Production Dashboard")
        st.markdown(
            "An interactive exploration of historical agricultural data across **Indian states**, "
            "crops, seasons, and years (**1997–2020**). Explore production patterns, yearly trends, "
            "and annual rainfall relationships."
        )
    with col2:
        st.write("")
        st.caption("Data Source")
        st.info("India Agro Historical Records")


# ==============================================================================
# 4. SIDEBAR FILTERS WITH RESET
# ==============================================================================
def render_sidebar_filters(df: pd.DataFrame) -> pd.DataFrame:
    """
    Renders interactive filters for Year Range, Crop, State, and Season.
    Provides reset functionality and returns the filtered DataFrame.
    """
    st.sidebar.header("🔍 Filter Records")

    # Min and max available years
    min_year = int(df["Crop_Year"].min())
    max_year = int(df["Crop_Year"].max())

    # Master lists for multiselects (sorted alphabetically)
    all_crops = sorted(df["Crop"].unique().tolist())
    all_states = sorted(df["State"].unique().tolist())
    all_seasons = sorted(df["Season"].unique().tolist())

    # Initialize session state for filters if not present
    if "filter_year_range" not in st.session_state:
        st.session_state["filter_year_range"] = (min_year, max_year)
    if "filter_crops" not in st.session_state:
        st.session_state["filter_crops"] = all_crops
    if "filter_states" not in st.session_state:
        st.session_state["filter_states"] = all_states
    if "filter_seasons" not in st.session_state:
        st.session_state["filter_seasons"] = all_seasons

    # Reset Filters Button
    if st.sidebar.button("🔄 Reset All Filters", use_container_width=True):
        st.session_state["filter_year_range"] = (min_year, max_year)
        st.session_state["filter_crops"] = all_crops
        st.session_state["filter_states"] = all_states
        st.session_state["filter_seasons"] = all_seasons
        st.rerun()

    # 1. Year Range Filter
    year_range = st.sidebar.slider(
        "📅 Crop Year Range",
        min_value=min_year,
        max_value=max_year,
        value=st.session_state["filter_year_range"],
        step=1,
        help="Select the range of agricultural years to include.",
    )
    st.session_state["filter_year_range"] = year_range

    st.sidebar.markdown("---")

    # Helper buttons for Crops
    crop_col1, crop_col2 = st.sidebar.columns(2)
    with crop_col1:
        if st.button("Select All Crops", key="btn_all_crops"):
            st.session_state["filter_crops"] = all_crops
            st.rerun()
    with crop_col2:
        if st.button("Clear Crops", key="btn_clear_crops"):
            st.session_state["filter_crops"] = []
            st.rerun()

    selected_crops = st.sidebar.multiselect(
        "🌱 Crops",
        options=all_crops,
        default=st.session_state["filter_crops"],
        help="Filter by specific crops.",
    )
    st.session_state["filter_crops"] = selected_crops

    st.sidebar.markdown("---")

    # Helper buttons for States
    state_col1, state_col2 = st.sidebar.columns(2)
    with state_col1:
        if st.button("Select All States", key="btn_all_states"):
            st.session_state["filter_states"] = all_states
            st.rerun()
    with state_col2:
        if st.button("Clear States", key="btn_clear_states"):
            st.session_state["filter_states"] = []
            st.rerun()

    selected_states = st.sidebar.multiselect(
        "📍 States",
        options=all_states,
        default=st.session_state["filter_states"],
        help="Filter by Indian states or union territories.",
    )
    st.session_state["filter_states"] = selected_states

    st.sidebar.markdown("---")

    # Helper buttons for Seasons
    season_col1, season_col2 = st.sidebar.columns(2)
    with season_col1:
        if st.button("All Seasons", key="btn_all_seasons"):
            st.session_state["filter_seasons"] = all_seasons
            st.rerun()
    with season_col2:
        if st.button("Clear Seasons", key="btn_clear_seasons"):
            st.session_state["filter_seasons"] = []
            st.rerun()

    selected_seasons = st.sidebar.multiselect(
        "⛅ Seasons",
        options=all_seasons,
        default=st.session_state["filter_seasons"],
        help="Filter by cultivation season (Kharif, Rabi, Whole Year, etc.).",
    )
    st.session_state["filter_seasons"] = selected_seasons

    # Apply all filters simultaneously
    filtered_df = df[
        (df["Crop_Year"] >= year_range[0])
        & (df["Crop_Year"] <= year_range[1])
        & (df["Crop"].isin(selected_crops))
        & (df["State"].isin(selected_states))
        & (df["Season"].isin(selected_seasons))
    ]

    return filtered_df


# ==============================================================================
# 5. KEY PERFORMANCE INDICATOR (KPI) CARDS
# ==============================================================================
def format_large_number(num: float) -> str:
    """Formats large numeric totals into clean, readable strings with suffixes."""
    if num >= 1e9:
        return f"{num / 1e9:.2f} B"
    elif num >= 1e6:
        return f"{num / 1e6:.2f} M"
    elif num >= 1e3:
        return f"{num / 1e3:.2f} K"
    else:
        return f"{num:,.2f}"


def render_kpis(filtered_df: pd.DataFrame):
    """Calculates and displays summary KPI cards for the filtered data."""
    st.subheader("📊 Key Performance Indicators")
    st.caption("Summary figures dynamically calculated from the currently filtered dataset.")

    if filtered_df.empty:
        total_prod = 0.0
        avg_yield = 0.0
        states_count = 0
        crops_count = 0
    else:
        total_prod = filtered_df["Production"].sum()
        avg_yield = filtered_df["Yield"].mean()
        states_count = filtered_df["State"].nunique()
        crops_count = filtered_df["Crop"].nunique()

    kpi1, kpi2, kpi3, kpi4 = st.columns(4)

    with kpi1:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-title">Total Production</div>
                <div class="metric-value">{format_large_number(total_prod)}</div>
                <div class="metric-subtitle">Exact: {total_prod:,.0f} units</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with kpi2:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-title">Average Yield</div>
                <div class="metric-value">{avg_yield:,.2f}</div>
                <div class="metric-subtitle">Mean yield across selections</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with kpi3:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-title">States Represented</div>
                <div class="metric-value">{states_count}</div>
                <div class="metric-subtitle">Active states/UTs in filter</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with kpi4:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-title">Crops Represented</div>
                <div class="metric-value">{crops_count}</div>
                <div class="metric-subtitle">Distinct agricultural crops</div>
            </div>
            """,
            unsafe_allow_html=True,
        )


# ==============================================================================
# 6. PRODUCTION CHARTS (CROP, YEARLY TREND, TOP STATES)
# ==============================================================================
def render_production_by_crop(filtered_df: pd.DataFrame):
    """Renders an interactive horizontal/vertical bar chart of production by crop."""
    st.subheader("🌾 Production by Crop")

    crop_summary = (
        filtered_df.groupby("Crop")["Production"]
        .sum()
        .reset_index()
        .sort_values(by="Production", ascending=False)
    )

    if crop_summary.empty or crop_summary["Production"].sum() == 0:
        st.info("No production data available for the chosen crop filter.")
        return

    # For readability, show top 20 if more than 20 crops are selected
    total_crops_count = len(crop_summary)
    display_limit = 20
    if total_crops_count > display_limit:
        chart_data = crop_summary.head(display_limit).copy()
        chart_title = f"Top {display_limit} Crops by Total Production (out of {total_crops_count} selected)"
    else:
        chart_data = crop_summary.copy()
        chart_title = "Total Production by Crop (Sorted Descending)"

    fig = px.bar(
        chart_data,
        x="Crop",
        y="Production",
        title=chart_title,
        labels={"Crop": "Crop Name", "Production": "Total Production"},
        text_auto=".2s",
        color="Production",
        color_continuous_scale="Greens",
    )
    fig.update_layout(
        xaxis_tickangle=-45,
        margin=dict(l=20, r=20, t=50, b=80),
        plot_bgcolor="#FFFFFF",
        paper_bgcolor="#FFFFFF",
        hovermode="x unified",
        coloraxis_showscale=False,
    )
    fig.update_traces(
        hovertemplate="<b>%{x}</b><br>Total Production: %{y:,.0f}<extra></extra>"
    )
    st.plotly_chart(fig, use_container_width=True)


def render_yearly_trend(filtered_df: pd.DataFrame):
    """Renders a chronological line chart showing production trends over time."""
    st.subheader("📈 Yearly Production Trend")

    yearly = (
        filtered_df.groupby("Crop_Year")["Production"]
        .sum()
        .reset_index()
        .sort_values("Crop_Year")
    )

    if yearly.empty:
        st.info("No yearly records available to plot.")
        return

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=yearly["Crop_Year"],
            y=yearly["Production"],
            mode="lines+markers",
            name="Total Production",
            line=dict(color="#2E7D32", width=3),
            marker=dict(size=7, color="#1B5E20"),
            hovertemplate="<b>Year %{x}</b><br>Total Production: %{y:,.0f}<extra></extra>",
        )
    )

    fig.update_layout(
        title="Chronological Production Trend Over Selected Years",
        xaxis=dict(
            title="Harvest Year",
            dtick=1,
            gridcolor="#EBF0E9",
            tickmode="linear",
        ),
        yaxis=dict(
            title="Total Production",
            gridcolor="#EBF0E9",
        ),
        plot_bgcolor="#FFFFFF",
        paper_bgcolor="#FFFFFF",
        margin=dict(l=20, r=20, t=50, b=40),
        hovermode="x",
    )
    st.plotly_chart(fig, use_container_width=True)


def render_top_states(filtered_df: pd.DataFrame):
    """Renders a horizontal bar chart displaying top 10 states by total production."""
    st.subheader("🏆 Top States by Production")

    state_summary = (
        filtered_df.groupby("State")["Production"]
        .sum()
        .reset_index()
        .sort_values(by="Production", ascending=False)
    )

    if state_summary.empty:
        st.info("No state data available for the chosen filters.")
        return

    top_count = min(10, len(state_summary))
    top_states = state_summary.head(top_count).sort_values("Production", ascending=True)

    fig = px.bar(
        top_states,
        x="Production",
        y="State",
        orientation="h",
        title=f"Top {top_count} States by Total Production",
        labels={"State": "State / Territory", "Production": "Total Production"},
        color="Production",
        color_continuous_scale="Tealgrn",
        text_auto=".2s",
    )
    fig.update_layout(
        margin=dict(l=20, r=20, t=50, b=40),
        plot_bgcolor="#FFFFFF",
        paper_bgcolor="#FFFFFF",
        coloraxis_showscale=False,
    )
    fig.update_traces(
        hovertemplate="<b>%{y}</b><br>Total Production: %{x:,.0f}<extra></extra>"
    )
    st.plotly_chart(fig, use_container_width=True)


# ==============================================================================
# 7. AUTOMATED AGRICULTURAL INSIGHTS
# ==============================================================================
def render_insights(filtered_df: pd.DataFrame):
    """
    Computes and displays automated observations from the currently filtered data.
    Clearly notes that correlation or volume dominance does not imply causation.
    """
    st.subheader("💡 Agricultural Insights (Filtered Observations)")

    if filtered_df.empty:
        st.info("No data available to generate insights.")
        return

    total_prod = filtered_df["Production"].sum()

    # 1. Top Crop & Dominance Share
    crop_totals = filtered_df.groupby("Crop")["Production"].sum()
    if not crop_totals.empty and total_prod > 0:
        top_crop = crop_totals.idxmax()
        top_crop_prod = crop_totals.max()
        top_crop_pct = (top_crop_prod / total_prod) * 100
        crop_insight = (
            f"**Highest Producing Crop:** <strong>{top_crop}</strong> accounts for "
            f"<strong>{top_crop_prod:,.0f}</strong> ({top_crop_pct:.1f}%) of the total production "
            f"within this selection."
        )
    else:
        crop_insight = "No positive production recorded among the selected crops."

    # 2. Top State
    state_totals = filtered_df.groupby("State")["Production"].sum()
    if not state_totals.empty and total_prod > 0:
        top_state = state_totals.idxmax()
        top_state_prod = state_totals.max()
        state_insight = (
            f"**Leading Production State:** <strong>{top_state}</strong> leads with "
            f"<strong>{top_state_prod:,.0f}</strong> in cumulative production."
        )
    else:
        state_insight = "No state production data available."

    # 3. Temporal Change
    yearly_totals = (
        filtered_df.groupby("Crop_Year")["Production"]
        .sum()
        .reset_index()
        .sort_values("Crop_Year")
    )

    if len(yearly_totals) >= 2:
        start_year = int(yearly_totals.iloc[0]["Crop_Year"])
        end_year = int(yearly_totals.iloc[-1]["Crop_Year"])
        start_val = yearly_totals.iloc[0]["Production"]
        end_val = yearly_totals.iloc[-1]["Production"]

        if start_val > 0:
            diff_pct = ((end_val - start_val) / start_val) * 100
            direction = "increased" if diff_pct >= 0 else "decreased"
            trend_insight = (
                f"**Multi-Year Trajectory:** Total production {direction} by "
                f"<strong>{abs(diff_pct):.1f}%</strong> from {start_year} ({start_val:,.0f}) "
                f"to {end_year} ({end_val:,.0f}) for the selected criteria."
            )
        else:
            trend_insight = (
                f"**Multi-Year Trajectory:** Production changed from {start_val:,.0f} in {start_year} "
                f"to {end_val:,.0f} in {end_year}."
            )
    else:
        trend_insight = "Selected year range covers a single year; temporal comparison across multiple years requires at least 2 distinct years."

    # Display insight cards
    st.markdown(f'<div class="insight-box">{crop_insight}</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="insight-box">{state_insight}</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="insight-box">{trend_insight}</div>', unsafe_allow_html=True)

    # Contextual Disclaimer
    st.markdown(
        """
        <div class="notice-box">
            📌 <strong>Analytical Note:</strong> These observations reflect historical aggregates 
            from the active filters. Crop production dominance can be influenced by regional crop choice 
            (e.g., coconut yields counted in individual units vs. grain metric tonnes), total land area, 
            irrigation infrastructure, and seasonal conditions.
        </div>
        """,
        unsafe_allow_html=True,
    )


# ==============================================================================
# 8. RAINFALL AND CROP YIELD ANALYSIS
# ==============================================================================
def render_rainfall_yield_analysis(filtered_df: pd.DataFrame):
    """
    Renders an interactive scatter plot comparing Annual_Rainfall vs Yield,
    calculates Pearson correlation coefficient safely, and explains limitations.
    """
    st.subheader("🌧️ Rainfall vs. Crop Yield Analysis")

    # Filter out records where rainfall or yield might be missing or non-positive
    analysis_df = filtered_df.dropna(subset=["Annual_Rainfall", "Yield"]).copy()

    if len(analysis_df) < 2:
        st.info("At least two valid data records are required to analyze rainfall vs. yield.")
        return

    # Calculate Pearson Correlation safely
    std_rain = analysis_df["Annual_Rainfall"].std()
    std_yield = analysis_df["Yield"].std()

    if std_rain == 0 or std_yield == 0 or np.isnan(std_rain) or np.isnan(std_yield):
        corr_val = None
        corr_msg = "Correlation undefined (constant rainfall or yield values across selected records)."
    else:
        corr_val = analysis_df["Annual_Rainfall"].corr(analysis_df["Yield"])
        if np.isnan(corr_val):
            corr_msg = "Correlation could not be determined due to low variance."
        else:
            if corr_val > 0.5:
                strength = "moderate to strong positive"
            elif corr_val > 0.1:
                strength = "weak positive"
            elif corr_val >= -0.1:
                strength = "near-zero (no linear correlation)"
            elif corr_val >= -0.5:
                strength = "weak negative"
            else:
                strength = "moderate to strong negative"
            corr_msg = f"Pearson correlation coefficient: **r = {corr_val:.3f}** ({strength} relationship)."

    stat_col1, stat_col2 = st.columns([0.4, 0.6])
    with stat_col1:
        st.markdown(f"**Statistical Measure:** {corr_msg}")
    with stat_col2:
        st.caption(
            "Sample size: "
            f"**{len(analysis_df):,}** observations | "
            f"Rainfall range: {analysis_df['Annual_Rainfall'].min():.1f} – {analysis_df['Annual_Rainfall'].max():.1f} mm"
        )

    # Downsample visually if more than 3,000 points to keep chart fast and responsive
    plot_df = analysis_df
    if len(analysis_df) > 3000:
        st.caption("ℹ️ Plotting a representative random sample of 3,000 points for optimal browser rendering performance.")
        plot_df = analysis_df.sample(n=3000, random_state=42)

    fig = px.scatter(
        plot_df,
        x="Annual_Rainfall",
        y="Yield",
        color="Crop",
        hover_data=["Crop", "State", "Crop_Year", "Season", "Area", "Production"],
        title="Annual Rainfall (mm) vs. Crop Yield",
        labels={"Annual_Rainfall": "Annual Rainfall (mm)", "Yield": "Crop Yield"},
        opacity=0.7,
    )

    fig.update_layout(
        plot_bgcolor="#FFFFFF",
        paper_bgcolor="#FFFFFF",
        margin=dict(l=20, r=20, t=50, b=40),
        xaxis=dict(gridcolor="#EBF0E9"),
        yaxis=dict(gridcolor="#EBF0E9"),
    )
    st.plotly_chart(fig, use_container_width=True)

    st.markdown(
        """
        <div class="notice-box">
            ⚠️ <strong>Correlation vs. Causation:</strong> A positive or negative correlation 
            indicates a statistical association, not direct causality. Agricultural yield is governed 
            by multifaceted agronomic drivers including soil health, temperature extremes, fertilizer/pesticide 
            application, timely irrigation, and pest infestation, rather than annual rainfall totals alone.
        </div>
        """,
        unsafe_allow_html=True,
    )


# ==============================================================================
# 9. YEAR-OVER-YEAR (YoY) PRODUCTION GROWTH ANALYSIS
# ==============================================================================
def render_yoy_growth_analysis(filtered_df: pd.DataFrame):
    """Calculates and displays annual percentage change in production compared to previous year."""
    st.subheader("📊 Year-over-Year (YoY) Production Growth")

    yearly = (
        filtered_df.groupby("Crop_Year")["Production"]
        .sum()
        .reset_index()
        .sort_values("Crop_Year")
    )

    if len(yearly) < 2:
        st.info("YoY growth analysis requires at least two distinct years in the selected filter.")
        return

    # Calculate previous year production and percentage change
    yearly["Previous_Year_Production"] = yearly["Production"].shift(1)
    
    # Safe percentage change handling zero division
    def calculate_pct_change(row):
        prev = row["Previous_Year_Production"]
        curr = row["Production"]
        if pd.isna(prev):
            return np.nan
        if prev == 0:
            return np.nan if curr == 0 else np.inf
        return ((curr - prev) / prev) * 100

    yearly["YoY_Growth_Pct"] = yearly.apply(calculate_pct_change, axis=1)

    chart_yoy = yearly.dropna(subset=["YoY_Growth_Pct"]).copy()

    # Bar chart of YoY Growth %
    chart_yoy["Growth_Direction"] = np.where(
        chart_yoy["YoY_Growth_Pct"] >= 0, "Positive Growth", "Negative Growth"
    )

    fig = px.bar(
        chart_yoy,
        x="Crop_Year",
        y="YoY_Growth_Pct",
        color="Growth_Direction",
        color_discrete_map={
            "Positive Growth": "#2E7D32",
            "Negative Growth": "#D32F2F",
        },
        title="Year-over-Year Production Growth Rate (%)",
        labels={"Crop_Year": "Harvest Year", "YoY_Growth_Pct": "YoY Growth (%)"},
        text_auto=".1f",
    )

    fig.update_layout(
        plot_bgcolor="#FFFFFF",
        paper_bgcolor="#FFFFFF",
        margin=dict(l=20, r=20, t=50, b=40),
        xaxis=dict(dtick=1, gridcolor="#EBF0E9"),
        yaxis=dict(gridcolor="#EBF0E9", title="Growth (%)"),
    )
    st.plotly_chart(fig, use_container_width=True)


# ==============================================================================
# 10. FILTERED DATA TABLE & CSV EXPORT
# ==============================================================================
def render_data_table(filtered_df: pd.DataFrame):
    """Renders an expandable interactive data table and provides a CSV download button."""
    with st.expander("📋 View Filtered Dataset & Export CSV", expanded=False):
        st.write(f"Displaying **{len(filtered_df):,}** records matching current filters:")

        st.dataframe(
            filtered_df[EXPECTED_COLUMNS],
            use_container_width=True,
            hide_index=True,
        )

        csv_bytes = filtered_df[EXPECTED_COLUMNS].to_csv(index=False).encode("utf-8")
        st.download_button(
            label="📥 Download Filtered Data as CSV",
            data=csv_bytes,
            file_name="filtered_crop_data.csv",
            mime="text/csv",
            help="Click to export the currently filtered agricultural records to a CSV file.",
        )


# ==============================================================================
# 11. MAIN CONTROLLER
# ==============================================================================
def main():
    # Resolve CSV dataset path relative to app.py
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, "crop_yield.csv")

    # Step 4: Load and validate dataset
    df = load_and_validate_data(dataset_path)

    # Render Header
    render_header()

    # Step 5: Render Sidebar Filters
    filtered_df = render_sidebar_filters(df)

    # Check for empty filter results
    if filtered_df.empty:
        st.warning(
            "⚠️ No agricultural records match your selected filter criteria. "
            "Please adjust the year range, crops, states, or seasons in the sidebar."
        )
        return

    # Step 6: Render Key Performance Indicators
    render_kpis(filtered_df)

    st.markdown("---")

    # Step 7: Render Production Charts in a 2-column layout
    col_chart1, col_chart2 = st.columns(2)
    with col_chart1:
        render_production_by_crop(filtered_df)
    with col_chart2:
        render_yearly_trend(filtered_df)

    # Top States Chart
    render_top_states(filtered_df)

    st.markdown("---")

    # Step 8: Agricultural Insights
    render_insights(filtered_df)

    st.markdown("---")

    # Step 9: Rainfall and Crop Yield Analysis
    render_rainfall_yield_analysis(filtered_df)

    st.markdown("---")

    # Additional Analysis: YoY Growth
    render_yoy_growth_analysis(filtered_df)

    st.markdown("---")

    # Step 10: Filtered Data Table and CSV Export
    render_data_table(filtered_df)


if __name__ == "__main__":
    main()
