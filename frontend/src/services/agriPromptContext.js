/**
 * AgriPromptContext: Domain Knowledge & Dynamic Context Injection Engine
 * ======================================================================
 * Dynamically grounds the LLM (Groq) with authoritative ICAR & NBSS&LUP
 * agronomic benchmarks, historical production metrics, and active dashboard state.
 * Supports intelligent entity extraction from user queries to avoid anchoring on
 * any single state or crop.
 */

/**
 * Intelligent entity detector to identify mentioned states and crops in user queries
 */
export function detectEntities(query, allStates = [], allCrops = []) {
  if (!query || typeof query !== 'string') {
    return { detectedStates: [], detectedCrops: [] };
  }
  const lower = query.toLowerCase();

  const stateAliases = {
    'up': 'Uttar Pradesh',
    'uttar pradesh': 'Uttar Pradesh',
    'mp': 'Madhya Pradesh',
    'madhya pradesh': 'Madhya Pradesh',
    'ap': 'Andhra Pradesh',
    'andhra pradesh': 'Andhra Pradesh',
    'tn': 'Tamil Nadu',
    'tamil nadu': 'Tamil Nadu',
    'wb': 'West Bengal',
    'bengal': 'West Bengal',
    'kashmir': 'Jammu and Kashmir',
    'j&k': 'Jammu and Kashmir',
    'maharashtra': 'Maharashtra',
    'punjab': 'Punjab',
    'haryana': 'Haryana',
    'rajasthan': 'Rajasthan',
    'gujarat': 'Gujarat',
    'karnataka': 'Karnataka',
    'kerala': 'Kerala',
    'bihar': 'Bihar',
    'odisha': 'Odisha',
    'assam': 'Assam',
    'chhattisgarh': 'Chhattisgarh',
    'jharkhand': 'Jharkhand',
    'telangana': 'Telangana',
    'uttarakhand': 'Uttarakhand',
    'himachal': 'Himachal Pradesh'
  };

  const cropAliases = {
    'paddy': 'Rice',
    'rice': 'Rice',
    'wheat': 'Wheat',
    'chana': 'Gram',
    'chickpea': 'Gram',
    'gram': 'Gram',
    'tur': 'Arhar/Tur',
    'arhar': 'Arhar/Tur',
    'pigeon pea': 'Arhar/Tur',
    'bajra': 'Bajra',
    'pearl millet': 'Bajra',
    'millet': 'Bajra',
    'millets': 'Bajra',
    'jowar': 'Jowar',
    'sorghum': 'Jowar',
    'maize': 'Maize',
    'corn': 'Maize',
    'cotton': 'Cotton(lint)',
    'sugarcane': 'Sugarcane',
    'mustard': 'Rapeseed &Mustard',
    'sarson': 'Rapeseed &Mustard',
    'rapeseed': 'Rapeseed &Mustard',
    'soybean': 'Soyabean',
    'soyabean': 'Soyabean',
    'groundnut': 'Groundnut',
    'peanut': 'Groundnut',
    'coconut': 'Coconut',
    'barley': 'Barley',
    'onion': 'Onion',
    'potato': 'Potato'
  };

  const detectedStates = new Set();
  const detectedCrops = new Set();

  for (const [alias, canonical] of Object.entries(stateAliases)) {
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(lower)) {
      detectedStates.add(canonical);
    }
  }
  for (const st of allStates) {
    if (lower.includes(st.toLowerCase())) {
      detectedStates.add(st);
    }
  }

  for (const [alias, canonical] of Object.entries(cropAliases)) {
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(lower)) {
      detectedCrops.add(canonical);
    }
  }
  for (const cr of allCrops) {
    if (lower.includes(cr.toLowerCase())) {
      detectedCrops.add(cr);
    }
  }

  return {
    detectedStates: Array.from(detectedStates),
    detectedCrops: Array.from(detectedCrops)
  };
}

/**
 * Builds the comprehensive, dynamic system prompt for Krishi AI
 */
export function buildAgriSystemPrompt({
  data,
  activeState = 'All India',
  activeCrop = 'All Crops',
  userQuery = '',
  excludeCoconut = false,
  liveWeatherData = null
}) {
  const kpis = data?.kpis || {};
  const cropProfiles = data?.crop_profiles || {};
  const stateProfiles = data?.state_profiles || {};
  const allStates = data?.all_states || [];
  const allCrops = data?.all_crops || [];

  // Check if specific states or crops were mentioned in the user's latest query
  const { detectedStates, detectedCrops } = detectEntities(userQuery, allStates, allCrops);

  // Determine effective state and crop context
  const effectiveStates = detectedStates.length > 0
    ? detectedStates
    : (activeState && activeState !== 'All India' ? [activeState] : []);

  const effectiveCrops = detectedCrops.length > 0
    ? detectedCrops
    : (activeCrop && activeCrop !== 'All Crops' ? [activeCrop] : []);

  // Format ICAR profiles for effective crops
  let injectedCropsSection = '';
  if (effectiveCrops.length > 0) {
    injectedCropsSection = effectiveCrops
      .filter(c => cropProfiles[c])
      .map(c => {
        const p = cropProfiles[c];
        const stagesText = (p.stages || [])
          .map(s => `    - Stage ${s.stage} (${s.name}, ${s.days}): ${s.guideline}`)
          .join('\n');
        return `• SPECIFIC CROP PROFILE: ${c} (${p.category})
  - Reporting Unit: ${p.unit}
  - Water Requirement: ${p.water_req_mm[0]} - ${p.water_req_mm[1]} mm
  - Temperature Window: ${p.temp_range_c[0]} - ${p.temp_range_c[1]} °C
  - Sowing Season: ${p.season} | Duration: ${p.duration_days[0]} - ${p.duration_days[1]} days
  - Suitable Soils: ${p.soils.join(', ')}
  - Biological Growth Stages:
${stagesText}`;
      })
      .join('\n\n');
  } else {
    injectedCropsSection = 'SCOPE: Pan-India Diverse Crops. Provide comparative agronomic insights across Kharif, Rabi, and Zaid seasons, contrasting water-intensive crops (Rice, Sugarcane) with climate-resilient alternatives (Millets, Pulses, Oilseeds).';
  }

  // Format state profiles for effective states
  let injectedStatesSection = '';
  if (effectiveStates.length > 0) {
    injectedStatesSection = effectiveStates
      .filter(s => stateProfiles[s])
      .map(s => {
        const sp = stateProfiles[s];
        const topCropsText = (sp.top_crops || [])
          .map(tc => `${tc.crop} (${Math.round(tc.production).toLocaleString()} units)`)
          .join(', ');
        return `• SPECIFIC REGIONAL PROFILE: ${s}
  - Agro-Climatic Zone: ${sp.zone}
  - Climate: ${sp.climate_desc}
  - Primary Cropping Season: ${sp.primary_season}
  - Dominant Soils: ${sp.soils.join(', ')}
  - Top Historic Commodities: ${topCropsText}`;
      })
      .join('\n\n');
  } else {
    injectedStatesSection = 'SCOPE: Pan-India (All 30 States & UTs). Frame answers with a broad national perspective across key agricultural zones (Gangetic Plains, Deccan Plateau, Western Arid Zone, Coastal Belts, North-East).';
  }

  // Staple benchmarks reference table
  const stapleCrops = ['Rice', 'Wheat', 'Bajra', 'Cotton', 'Sugarcane', 'Maize', 'Gram', 'Mustard', 'Soyabean', 'Coconut'];
  const stapleProfilesText = stapleCrops
    .filter(c => cropProfiles[c])
    .map(c => {
      const p = cropProfiles[c];
      return `• ${c} (${p.category}): Water: ${p.water_req_mm[0]}-${p.water_req_mm[1]}mm | Temp: ${p.temp_range_c[0]}-${p.temp_range_c[1]}°C | Season: ${p.season} | Soils: ${p.soils.slice(0, 2).join(', ')}`;
    })
    .join('\n');

  // Live satellite weather context
  let liveWeatherContext = '';
  if (liveWeatherData && effectiveStates.length === 1) {
    liveWeatherContext = `
LIVE METEOROLOGICAL TELEMETRY (${effectiveStates[0]}):
• Ambient Temperature: ${liveWeatherData.temperature}°C | Humidity: ${liveWeatherData.humidity}% | Precip: ${liveWeatherData.precipitation} mm | Wind: ${liveWeatherData.windSpeed} km/h
`;
  }

  return `You are "KRISHI AI" (कृषि AI), the elite National Agronomic Intelligence & Decision Copilot integrated into the Indian Agricultural Command Center.
You are powered by high-speed Groq LPU inference and grounded in authentic agronomic benchmarks from:
- ICAR (Indian Council of Agricultural Research)
- NBSS&LUP (National Bureau of Soil Survey and Land Use Planning)
- DES (Directorate of Economics & Statistics, Ministry of Agriculture)
- TNAU (Tamil Nadu Agricultural University Agritech Portal)
- Open-Meteo Global WMO Satellite Feed

=======================================================
NATIONAL DATASET OVERVIEW (1997 - 2020)
=======================================================
• Historical Scope: 19,689 validated production observations across 30 Indian States/UTs and 55 unique crops.
• Aggregate Production: ${kpis.total_production ? Math.round(kpis.total_production).toLocaleString() : '309+ Billion'} units.
• Aggregate Cultivated Area: ${kpis.total_area ? Math.round(kpis.total_area).toLocaleString() : '1.3+ Billion'} Hectares.
• Mean Yield: ${kpis.avg_yield ? kpis.avg_yield.toFixed(2) : '82.5'} MT/Ha (heavily affected when Coconut is included).
• COCONUT METRIC NUANCE: In Indian agricultural statistics, Coconut is recorded in NUTS (over 308 Billion nuts), whereas food & cash crops (Rice, Wheat, Sugarcane) are recorded in METRIC TONNES. Current Dashboard Filter: ${excludeCoconut ? 'Metric Tonnes Only (Coconut EXCLUDED)' : 'All Commodities (Coconut INCLUDED)'}.

=======================================================
AUTHENTIC BENCHMARK SNAPSHOT (ICAR)
=======================================================
${stapleProfilesText}

=======================================================
ACTIVE CONTEXT FOR THIS CONVERSATION
=======================================================
${injectedStatesSection}

${injectedCropsSection}
${liveWeatherContext}

=======================================================
CRITICAL INSTRUCTIONS & RESPONSE PERSONA
=======================================================
1. Dynamic Entity Priority: Always focus your response directly on the state(s) and crop(s) the user asks about. Do NOT default to Wheat or Punjab unless the user explicitly requested them or selected them.
2. Pan-India Queries: If the user asks a general or national question without mentioning a specific state, provide a balanced pan-India response comparing major agro-climatic zones rather than limiting to a single state.
3. Scientific Rigor: Always cite specific ICAR water requirements (mm), temperature ranges (°C), soil types (e.g. Alluvial Loam, Black Regur, Red Sandy Loam, Laterite), and optimal sowing seasons (Kharif, Rabi, Zaid).
4. Practical Guidance: Provide actionable advice for farmers and researchers (e.g., drip irrigation savings, crop diversification, intercropping, soil nutrient management).
5. Formatting: Use structured Markdown with bold metrics, bullet points, concise tables, and relevant emojis (🌾, 💧, 🧪, 📍, ⚠️).`;
}

/**
 * Returns contextual quick prompts based on active dashboard state
 */
export function getQuickPrompts({ activeState = 'All India', activeCrop = 'All Crops' }) {
  const isPanIndia = !activeState || activeState === 'All India';
  const isAllCrops = !activeCrop || activeCrop === 'All Crops';

  return [
    {
      id: 'water_economics',
      icon: '💧',
      title: 'Water Footprint: Rice vs Millets',
      prompt: 'Compare the water footprint of Rice vs Millets (Bajra/Jowar) under ICAR benchmarks. How much irrigation water can be saved through diversification?'
    },
    {
      id: 'active_crop_guide',
      icon: '🌾',
      title: isAllCrops ? 'Kharif vs Rabi Sowing Strategy' : `${activeCrop} Sowing & Advisory`,
      prompt: isAllCrops
        ? 'What are the optimal sowing calendars and temperature windows for major Kharif and Rabi crops under ICAR guidelines?'
        : `Provide complete ICAR agronomic guidelines for cultivating ${activeCrop}: optimal sowing window, temperature tolerance, critical irrigation stages, and soil preparation.`
    },
    {
      id: 'state_feasibility',
      icon: '📍',
      title: isPanIndia ? 'National Crop Yield Shifts' : `${activeState} Crop Suitability`,
      prompt: isPanIndia
        ? 'Which Indian states demonstrate the highest yield potential for foodgrains, and what are the main regional agro-climatic constraints?'
        : `Analyze crop suitability for ${activeState} based on its dominant soil taxonomy, agro-climatic zone, and rainfall patterns. What are the best Kharif and Rabi rotations?`
    },
    {
      id: 'coconut_anomaly',
      icon: '🥥',
      title: 'Coconut Tonnes vs Nuts Anomaly',
      prompt: 'Why does Coconut create a major statistical discrepancy in Indian agricultural production records, and why is the "Exclude Coconut" filter essential?'
    },
    {
      id: 'drought_resilience',
      icon: '☀️',
      title: 'Drought Resilience & Millets',
      prompt: 'Which Indian crops exhibit the highest heat and drought resilience under ICAR standards? Suggest a climate-adaptive cropping strategy for semi-arid zones.'
    },
    {
      id: 'fertilizer_pesticide',
      icon: '🧪',
      title: isPanIndia ? 'Soil Health & NPK Management' : `${activeState} Soil & Nutrient Plan`,
      prompt: isPanIndia
        ? 'What are the recommended NPK and organic fertilization strategies to prevent soil degradation and maximize long-term agricultural yields across India?'
        : `What are the recommended NPK and organic fertilization strategies to prevent soil degradation and maximize long-term yield in ${activeState}?`
    }
  ];
}
