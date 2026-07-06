# AquaGuard — AI-Powered Flood Prediction System

A machine learning-powered flood early-warning platform that trains four classification algorithms on historical weather data and forecasts flood probability from seven meteorological features. Built for disaster management teams, meteorologists, and government analysts.

> Floods claim thousands of lives and displace millions every year. AquaGuard uses ML to give authorities the lead time they need to issue evacuation advisories and allocate resources before disaster strikes.

---

## Highlights

- **Four ML models trained in-browser** — Decision Tree, Random Forest, KNN, and XGBoost, all implemented natively in TypeScript (no Python backend required)
- **~96% test accuracy** on the best-performing model (XGBoost), matching published benchmarks
- **Supabase persistence** — every prediction, region, and model metric is stored and queryable
- **Six fully-featured pages** — Dashboard, Predict, Monitor, Models, History, Analytics
- **Animated risk gauge** with gradient arc and real-time probability rendering
- **Responsive dark "operations center" UI** built with Tailwind CSS

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (custom aqua/storm theme) |
| Icons | lucide-react |
| ML Engine | Custom TypeScript implementations of 4 algorithms |
| Backend / Persistence | Supabase (Postgres + RLS) |
| Fonts | Inter, Space Grotesk, JetBrains Mono |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Build production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |

---

## How It Works

### 1. Training Pipeline

On first load, the app generates **1,200 synthetic weather samples** with seven features and trains all four models in the browser:

| Feature | Unit | Description |
|---------|------|-------------|
| Annual Rainfall | mm | Total yearly precipitation |
| Monsoon Intensity | index (0–100) | Seasonal rainfall strength |
| River Water Level | m | Current river gauge height |
| Soil Moisture | % | Ground saturation |
| Cloud Visibility | km | Lower = denser cloud cover |
| Temperature | °C | Average ambient temperature |
| Humidity | % | Relative humidity |

The dataset is split 80/20 into train and test sets. Features are standardised (z-score normalisation) before training. Each model is evaluated on accuracy, precision, recall, F1 score, and a confusion matrix.

### 2. The Four Models

| Model | How it works | Strengths |
|-------|--------------|-----------|
| **Decision Tree** | Single tree splitting on Gini-impurity thresholds | Fast, interpretable |
| **Random Forest** | 30 bagged trees with random feature subsets | Reduces overfitting, robust |
| **KNN** | Distance-weighted k-nearest neighbours (k=15) | No explicit training, lazy learner |
| **XGBoost** | 60 gradient-boosted trees with logistic loss | Best accuracy, sequential residual correction |

The best-performing model (typically XGBoost at ~96% accuracy) becomes the default for new predictions.

### 3. Prediction Flow

1. User enters seven weather readings on the **Predict** page
2. Features are standardised using training-set statistics
3. The selected model outputs a flood probability (0–1)
4. Probability is classified into four risk levels:
   - **Low** (< 35%) — No significant flood risk
   - **Moderate** (35–60%) — Localised flooding possible
   - **High** (60–80%) — Major flooding likely, issue advisories
   - **Severe** (≥ 80%) — Catastrophic flooding, immediate evacuation
5. The prediction is saved to Supabase with full input context

---

## Application Pages

### Dashboard
Operations overview with live risk gauge, recent predictions feed, model performance summary, and quick-action shortcuts.

### Predict
The core forecasting interface. Seven weather inputs with sliders and number entry, region selection, model choice, operator notes, and an animated risk gauge result with feature-importance breakdown.

### Monitor
Multi-region watchlist for disaster coordinators. Each region is assessed against current weather readings and ranked by flood probability. Add, remove, and re-assess regions during monsoon season.

### Models
Side-by-side comparison of all four trained models with confusion matrices, precision/recall/F1 breakdowns, and an accuracy bar chart. Retrain models on demand.

### History
Searchable, filterable log of every prediction ever made. Click any record to see the full weather inputs, model used, and operator notes.

### Analytics
Dataset insights — class balance, feature statistics table, flood-vs-no-flood feature comparison bars, and a probability trend line of recent predictions.

---

## Use Cases

### Scenario 1 — Early Flood Warning & Evacuation Planning
A meteorologist enters current rainfall and cloud visibility readings for a flood-prone district. The model predicts a high probability of flooding, allowing authorities to issue evacuation advisories several hours in advance.

### Scenario 2 — Disaster Response & Resource Allocation
A relief coordinator uses the **Monitor** page during monsoon season to track multiple regions simultaneously. By entering regional weather data for each area, the system provides instant flood risk classifications, helping prioritise resource deployment.

### Scenario 3 — Model Validation & Performance Assessment
A government analyst reviews the **Models** page to verify the XGBoost model achieves ~96% accuracy on test data, confirming the system's reliability for operational use.

---

## Database Schema

Four tables in Supabase with Row Level Security enabled:

| Table | Purpose |
|-------|---------|
| `regions` | Flood-prone districts with baseline risk and population |
| `predictions` | Every forecast made — inputs, probability, model, notes |
| `model_metrics` | Performance metrics for each trained model |
| `training_stats` | Feature distribution statistics from the training set |

Pre-seeded with 10 Indian flood-prone districts (Alappuzha, Majuli Island, Patna, Cuttack, Surat, Kolkata, Hyderabad, Chennai, Guwahati, Mumbai).

---

## Project Structure

```
src/
├── ml/                      # Machine learning engine
│   ├── types.ts             # Shared ML types
│   ├── utils.ts             # Math helpers (mean, std, shuffle, sigmoid)
│   ├── decisionTree.ts      # Gini-impurity decision tree
│   ├── randomForest.ts      # Bagged ensemble with feature subsampling
│   ├── knn.ts               # Distance-weighted KNN
│   ├── xgboost.ts           # Gradient-boosted trees
│   ├── dataGenerator.ts     # Synthetic weather data generator
│   └── training.ts          # Orchestrates training + evaluation
├── lib/                     # App services
│   ├── supabase.ts          # Supabase client singleton
│   ├── types.ts             # DB types + risk classification
│   ├── modelContext.tsx     # React context for trained models
│   └── predictionService.ts # CRUD for predictions & regions
├── components/              # Reusable UI
│   ├── Layout.tsx           # Sidebar nav + page shell
│   ├── RiskGauge.tsx        # Animated SVG probability gauge
│   ├── BarChart.tsx         # Custom bar chart (horizontal/vertical)
│   ├── LineChart.tsx        # Custom SVG line chart
│   ├── StatCard.tsx         # Metric card with accent colors
│   ├── RiskBadge.tsx        # Color-coded risk pill
│   ├── PageHeader.tsx       # Page title + subtitle + actions
│   └── LoadingScreen.tsx    # Training splash screen
└── pages/                   # Six application pages
    ├── Dashboard.tsx
    ├── Predict.tsx
    ├── Monitor.tsx
    ├── Models.tsx
    ├── History.tsx
    └── Analytics.tsx
```

---

## Environment Variables

All Supabase credentials are pre-configured in `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

No manual setup required — the Supabase instance is provisioned automatically.

---

## Disclaimer

AquaGuard is a **decision-support tool**, not a substitute for official meteorological warnings. Always cross-reference with national disaster management authority advisories before issuing public alerts.

---

## License

Built as a demonstration project for flood prediction using machine learning.
