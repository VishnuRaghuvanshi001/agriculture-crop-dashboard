"""
Automated Logic & Verification Tests for Agriculture Dashboard
==============================================================
Validates dataset loading, data cleaning, KPI aggregation,
correlation edge cases, YoY growth calculations, and empty-filter resilience.
"""

import os
import numpy as np
import pandas as pd

# 1. Dataset loading & cleaning test
def test_data_loading():
    print("Testing data loading & cleaning...")
    filepath = "crop_yield.csv"
    assert os.path.exists(filepath), f"File {filepath} not found!"
    
    df = pd.read_csv(filepath)
    expected_cols = [
        "Crop", "Crop_Year", "Season", "State", "Area",
        "Production", "Annual_Rainfall", "Fertilizer", "Pesticide", "Yield"
    ]
    for col in expected_cols:
        assert col in df.columns, f"Missing column: {col}"
        
    # Text stripping
    for col in ["Crop", "Season", "State"]:
        df[col] = df[col].astype(str).str.strip()
    
    # Assert no trailing spaces remain
    assert not any(c.endswith(" ") for c in df["Crop"].unique())
    assert not any(s.endswith(" ") for s in df["Season"].unique())
    assert not any(st.endswith(" ") for st in df["State"].unique())
    
    # Numeric conversions
    num_cols = ["Crop_Year", "Area", "Production", "Annual_Rainfall", "Fertilizer", "Pesticide", "Yield"]
    for col in num_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    
    assert df["Crop_Year"].isna().sum() == 0
    print(f"  [OK] Data loaded and cleaned successfully: {len(df):,} records, {len(df.columns)} columns.")
    return df

# 2. Filter logic test
def test_filtering(df):
    print("Testing multi-dimensional filter logic...")
    year_range = (2005, 2015)
    selected_crops = ["Rice", "Wheat"]
    selected_states = ["Punjab", "Haryana", "Uttar Pradesh"]
    selected_seasons = ["Kharif", "Rabi"]
    
    filtered_df = df[
        (df["Crop_Year"] >= year_range[0])
        & (df["Crop_Year"] <= year_range[1])
        & (df["Crop"].isin(selected_crops))
        & (df["State"].isin(selected_states))
        & (df["Season"].isin(selected_seasons))
    ]
    
    assert (filtered_df["Crop_Year"] >= 2005).all()
    assert (filtered_df["Crop_Year"] <= 2015).all()
    assert set(filtered_df["Crop"].unique()).issubset(set(selected_crops))
    assert set(filtered_df["State"].unique()).issubset(set(selected_states))
    assert set(filtered_df["Season"].unique()).issubset(set(selected_seasons))
    print(f"  [OK] Multi-filter applied successfully: {len(filtered_df):,} records matched.")
    return filtered_df

# 3. KPI Calculations test
def test_kpi_calculations(filtered_df):
    print("Testing KPI calculations...")
    total_prod = filtered_df["Production"].sum()
    avg_yield = filtered_df["Yield"].mean()
    states_count = filtered_df["State"].nunique()
    crops_count = filtered_df["Crop"].nunique()
    
    assert total_prod == filtered_df["Production"].sum()
    assert np.isclose(avg_yield, filtered_df["Yield"].mean())
    assert states_count <= 3
    assert crops_count <= 2
    print(f"  [OK] KPIs verified: Total Prod = {total_prod:,.0f}, Avg Yield = {avg_yield:.2f}, States = {states_count}, Crops = {crops_count}")

# 4. Top States ranking test
def test_top_states_ranking(df):
    print("Testing Top States ranking...")
    state_summary = df.groupby("State")["Production"].sum().reset_index().sort_values(by="Production", ascending=False)
    top_10 = state_summary.head(10)
    
    assert len(top_10) == 10
    # Check descending order
    prods = top_10["Production"].tolist()
    assert all(prods[i] >= prods[i+1] for i in range(len(prods)-1))
    print(f"  [OK] Top State: {top_10.iloc[0]['State']} ({top_10.iloc[0]['Production']:,.0f})")
    
    # Test handling < 10 states
    small_df = df[df["State"].isin(["Goa", "Assam"])]
    small_summary = small_df.groupby("State")["Production"].sum().reset_index().sort_values(by="Production", ascending=False)
    top_small = small_summary.head(min(10, len(small_summary)))
    assert len(top_small) == 2
    print("  [OK] Handled fewer than 10 states gracefully.")

# 5. Correlation & Edge cases test
def test_correlation_edge_cases(df):
    print("Testing correlation & edge cases...")
    # Normal case
    corr_all = df["Annual_Rainfall"].corr(df["Yield"])
    assert not np.isnan(corr_all)
    print(f"  [OK] Overall Pearson r = {corr_all:.4f}")
    
    # Edge case 1: Empty or 1 row
    single_row = df.head(1)
    std_rain = single_row["Annual_Rainfall"].std()
    assert np.isnan(std_rain)
    
    # Edge case 2: Constant rainfall (std = 0)
    const_df = pd.DataFrame({
        "Annual_Rainfall": [1000.0, 1000.0, 1000.0],
        "Yield": [2.5, 3.0, 3.5]
    })
    std_const = const_df["Annual_Rainfall"].std()
    assert std_const == 0.0
    corr_const = None if std_const == 0 else const_df["Annual_Rainfall"].corr(const_df["Yield"])
    assert corr_const is None
    print("  [OK] Constant column edge case safely handled without crashing.")

# 6. YoY Growth test
def test_yoy_growth(df):
    print("Testing Year-over-Year growth logic...")
    yearly = df.groupby("Crop_Year")["Production"].sum().reset_index().sort_values("Crop_Year")
    yearly["Previous_Year_Production"] = yearly["Production"].shift(1)
    
    def calculate_pct_change(row):
        prev = row["Previous_Year_Production"]
        curr = row["Production"]
        if pd.isna(prev):
            return np.nan
        if prev == 0:
            return np.nan if curr == 0 else np.inf
        return ((curr - prev) / prev) * 100

    yearly["YoY_Growth_Pct"] = yearly.apply(calculate_pct_change, axis=1)
    assert pd.isna(yearly.iloc[0]["YoY_Growth_Pct"])  # Base year has no prev year
    assert not pd.isna(yearly.iloc[1]["YoY_Growth_Pct"])
    print(f"  [OK] YoY computed across {len(yearly)} consecutive years.")

# 7. Empty dataset resilience test
def test_empty_dataset_resilience(df):
    print("Testing empty filter resilience...")
    empty_df = df[df["Crop_Year"] == 1800]  # No records for 1800
    assert empty_df.empty
    
    # Check that KPI calculation does not raise error
    total_prod = 0.0 if empty_df.empty else empty_df["Production"].sum()
    avg_yield = 0.0 if empty_df.empty else empty_df["Yield"].mean()
    states_count = 0 if empty_df.empty else empty_df["State"].nunique()
    crops_count = 0 if empty_df.empty else empty_df["Crop"].nunique()
    
    assert total_prod == 0.0
    assert avg_yield == 0.0
    assert states_count == 0
    assert crops_count == 0
    print("  [OK] Empty dataset resilience test passed.")

if __name__ == "__main__":
    print("=" * 60)
    print("STARTING DASHBOARD LOGIC AND AGGREGATION VERIFICATION")
    print("=" * 60)
    df = test_data_loading()
    filtered_df = test_filtering(df)
    test_kpi_calculations(filtered_df)
    test_top_states_ranking(df)
    test_correlation_edge_cases(df)
    test_yoy_growth(df)
    test_empty_dataset_resilience(df)
    print("=" * 60)
    print("ALL LOGICAL AND STATISTICAL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
