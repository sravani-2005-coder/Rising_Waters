/*
# Flood Prediction System - Database Schema

## Overview
This migration creates the complete schema for a machine learning-powered flood
prediction system. The app trains classification models (Decision Tree, Random
Forest, KNN, XGBoost) on historical weather data and uses the best model to
predict flood likelihood for new weather readings.

This is a SINGLE-TENANT app (no sign-in screen). All policies use
`TO anon, authenticated` so the anon-key frontend can read and write its own data.

## New Tables

### 1. `regions`
Stores flood-prone districts/regions that can be monitored.
- `id` (uuid, primary key)
- `name` (text, not null) - region/district name
- `state` (text) - state or province
- `population` (integer) - approximate population
- `risk_level` (text) - baseline risk classification: low / moderate / high / severe
- `lat` (numeric, nullable) - latitude for map positioning
- `lng` (numeric, nullable) - longitude for map positioning
- `created_at` (timestamptz)

### 2. `predictions`
Stores every flood prediction made through the app, including the input weather
features, the predicted probability, the classification, and the model used.
- `id` (uuid, primary key)
- `region_id` (uuid, nullable, references regions) - optional region association
- `region_name` (text, nullable) - denormalised name for quick display
- `annual_rainfall` (numeric) - annual rainfall in mm
- `cloud_visibility` (numeric) - cloud visibility metric (km or index)
- `monsoon_intensity` (numeric) - monsoon rainfall intensity
- `river_water_level` (numeric) - river water level in metres
- `soil_moisture` (numeric) - soil moisture percentage
- `temperature` (numeric) - average temperature in Celsius
- `humidity` (numeric) - relative humidity percentage
- `flood_probability` (numeric) - model output probability 0..1
- `flood_predicted` (boolean) - final classification
- `risk_level` (text) - low / moderate / high / severe
- `model_used` (text) - which model produced the prediction
- `notes` (text, nullable) - operator notes
- `created_at` (timestamptz)

### 3. `model_metrics`
Stores performance metrics for each trained model so the UI can render the
comparison table without re-training.
- `id` (uuid, primary key)
- `model_name` (text, not null) - Decision Tree / Random Forest / KNN / XGBoost
- `accuracy` (numeric) - test accuracy 0..1
- `precision` (numeric) - precision 0..1
- `recall` (numeric) - recall 0..1
- `f1_score` (numeric) - F1 score 0..1
- `training_samples` (integer) - number of samples used for training
- `test_samples` (integer) - number of samples used for testing
- `is_best` (boolean) - true for the best-performing model
- `trained_at` (timestamptz) - when the model was trained
- `created_at` (timestamptz)

### 4. `training_stats`
Stores summary statistics about the training dataset (feature means, stds, etc.)
so the UI can display dataset insights and so feature normalisation is consistent.
- `id` (uuid, primary key)
- `feature_name` (text, not null) - name of the feature
- `mean` (numeric) - mean value
- `std` (numeric) - standard deviation
- `min` (numeric) - minimum value
- `max` (numeric) - maximum value
- `flood_positive_mean` (numeric) - mean value for flood-positive samples
- `flood_negative_mean` (numeric) - mean value for flood-negative samples
- `created_at` (timestamptz)

## Security
- RLS enabled on every table.
- All tables use `TO anon, authenticated` policies (single-tenant, no auth).
- Full CRUD allowed for anon + authenticated because the data is intentionally
  shared/public within this disaster-management tool.
*/

-- ============================================================
-- regions
-- ============================================================
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text,
  population integer,
  risk_level text DEFAULT 'moderate',
  lat numeric,
  lng numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_regions" ON regions;
CREATE POLICY "anon_select_regions" ON regions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_regions" ON regions;
CREATE POLICY "anon_insert_regions" ON regions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_regions" ON regions;
CREATE POLICY "anon_update_regions" ON regions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_regions" ON regions;
CREATE POLICY "anon_delete_regions" ON regions FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- predictions
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  region_name text,
  annual_rainfall numeric NOT NULL,
  cloud_visibility numeric NOT NULL,
  monsoon_intensity numeric NOT NULL,
  river_water_level numeric NOT NULL,
  soil_moisture numeric NOT NULL,
  temperature numeric NOT NULL,
  humidity numeric NOT NULL,
  flood_probability numeric NOT NULL,
  flood_predicted boolean NOT NULL,
  risk_level text NOT NULL,
  model_used text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_predictions" ON predictions;
CREATE POLICY "anon_select_predictions" ON predictions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_predictions" ON predictions;
CREATE POLICY "anon_insert_predictions" ON predictions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_predictions" ON predictions;
CREATE POLICY "anon_update_predictions" ON predictions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_predictions" ON predictions;
CREATE POLICY "anon_delete_predictions" ON predictions FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- model_metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS model_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  accuracy numeric NOT NULL,
  precision numeric NOT NULL,
  recall numeric NOT NULL,
  f1_score numeric NOT NULL,
  training_samples integer NOT NULL,
  test_samples integer NOT NULL,
  is_best boolean DEFAULT false,
  trained_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE model_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_model_metrics" ON model_metrics;
CREATE POLICY "anon_select_model_metrics" ON model_metrics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_model_metrics" ON model_metrics;
CREATE POLICY "anon_insert_model_metrics" ON model_metrics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_model_metrics" ON model_metrics;
CREATE POLICY "anon_update_model_metrics" ON model_metrics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_model_metrics" ON model_metrics;
CREATE POLICY "anon_delete_model_metrics" ON model_metrics FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- training_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS training_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL,
  mean numeric NOT NULL,
  std numeric NOT NULL,
  min numeric NOT NULL,
  max numeric NOT NULL,
  flood_positive_mean numeric NOT NULL,
  flood_negative_mean numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_training_stats" ON training_stats;
CREATE POLICY "anon_select_training_stats" ON training_stats FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_training_stats" ON training_stats;
CREATE POLICY "anon_insert_training_stats" ON training_stats FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_training_stats" ON training_stats;
CREATE POLICY "anon_update_training_stats" ON training_stats FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_training_stats" ON training_stats;
CREATE POLICY "anon_delete_training_stats" ON training_stats FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_risk_level ON predictions (risk_level);
CREATE INDEX IF NOT EXISTS idx_predictions_region_id ON predictions (region_id);
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_name ON model_metrics (model_name);
