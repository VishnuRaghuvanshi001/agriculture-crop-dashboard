
import streamlit as st
import pandas as pd

st.set_page_config(
    page_title="Indian Agriculture Dashboard",
    page_icon="🌾",
    layout="wide"
)

@st.cache_data
def load_data():
    df = pd.read_csv("crop_yield.csv")
    for col in ["Crop", "Season", "State"]:
        df[col] = df[col].astype(str).str.strip()
    return df

df = load_data()

st.title("🌾 Indian Agriculture & Crop Production Dashboard")
st.write("Explore crop production, yield, and agricultural trends across Indian states.")

# Sidebar filters
st.sidebar.header("Filter Data")

years = sorted(df["Crop_Year"].dropna().unique())
selected_years = st.sidebar.slider(
    "Select year range",
    int(min(years)),
    int(max(years)),
    (int(min(years)), int(max(years)))
)

crops = sorted(df["Crop"].dropna().unique())
selected_crops = st.sidebar.multiselect(
    "Select crops",
    crops,
    default=crops[:5]
)

states = sorted(df["State"].dropna().unique())
selected_states = st.sidebar.multiselect(
    "Select states",
    states,
    default=states
)

filtered = df[
    df["Crop_Year"].between(selected_years[0], selected_years[1])
    & df["Crop"].isin(selected_crops)
    & df["State"].isin(selected_states)
]

if filtered.empty:
    st.warning("No data matches your filters. Select different crops or states.")
    st.stop()

# Summary metrics
st.subheader("Key Agricultural Indicators")

col1, col2, col3, col4 = st.columns(4)

col1.metric("Total Production", f"{filtered['Production'].sum():,.0f}")
col2.metric("Average Yield", f"{filtered['Yield'].mean():,.2f}")
col3.metric("States Selected", f"{filtered['State'].nunique()}")
col4.metric("Crops Selected", f"{filtered['Crop'].nunique()}")

st.divider()

# Production by crop
st.subheader("Production by Crop")

crop_production = (
    filtered.groupby("Crop")["Production"]
    .sum()
    .sort_values(ascending=False)
    .head(10)
)

st.bar_chart(crop_production)

# Year-wise trend
st.subheader("Year-wise Production Trend")

yearly_production = (
    filtered.groupby("Crop_Year")["Production"]
    .sum()
    .sort_index()
)

st.line_chart(yearly_production)

# State-wise production
st.subheader("Top 10 States by Production")

state_production = (
    filtered.groupby("State")["Production"]
    .sum()
    .sort_values(ascending=False)
    .head(10)
)

st.bar_chart(state_production)

# Raw data
with st.expander("View filtered dataset"):
    st.dataframe(filtered, use_container_width=True)

st.caption("Source: Crop Yield in Indian States dataset.")

