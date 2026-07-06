import { supabase } from './supabase';
import type { PredictionRecord, Region } from './types';
import { inputToFeatures, type WeatherInput } from '../ml/dataGenerator';
import { classifyRisk } from './types';
import type { TrainingResult } from '../ml/training';

export interface PredictionInput extends WeatherInput {
  regionId?: string | null;
  regionName?: string | null;
  notes?: string | null;
  modelName?: string;
}

export interface PredictionOutput {
  probability: number;
  label: number;
  risk: ReturnType<typeof classifyRisk>;
  modelUsed: string;
  confidence: number;
  record: PredictionRecord;
}

export async function runPrediction(
  input: PredictionInput,
  training: TrainingResult,
): Promise<PredictionOutput> {
  const features = inputToFeatures(input);
  const modelName = input.modelName ?? training.bestModel.name;
  const bundle = training.models.find((m) => m.name === modelName) ?? training.bestModel;
  const result = bundle.model.predict(features);

  const risk = classifyRisk(result.probability);

  const insertPayload = {
    region_id: input.regionId ?? null,
    region_name: input.regionName ?? null,
    annual_rainfall: input.annual_rainfall,
    cloud_visibility: input.cloud_visibility,
    monsoon_intensity: input.monsoon_intensity,
    river_water_level: input.river_water_level,
    soil_moisture: input.soil_moisture,
    temperature: input.temperature,
    humidity: input.humidity,
    flood_probability: result.probability,
    flood_predicted: result.label === 1,
    risk_level: risk.level,
    model_used: modelName,
    notes: input.notes ?? null,
  };

  const { data, error } = await supabase
    .from('predictions')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to save prediction');
  }

  return {
    probability: result.probability,
    label: result.label,
    risk,
    modelUsed: modelName,
    confidence: result.confidence,
    record: data as PredictionRecord,
  };
}

export async function fetchPredictions(limit = 100): Promise<PredictionRecord[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as PredictionRecord[];
}

export async function deletePrediction(id: string): Promise<void> {
  const { error } = await supabase.from('predictions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchRegions(): Promise<Region[]> {
  const { data, error } = await supabase.from('regions').select('*').order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Region[];
}

export async function createRegion(region: Omit<Region, 'id' | 'created_at'>): Promise<Region> {
  const { data, error } = await supabase
    .from('regions')
    .insert(region)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create region');
  return data as Region;
}

export async function deleteRegion(id: string): Promise<void> {
  const { error } = await supabase.from('regions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function seedDefaultRegions(): Promise<Region[]> {
  const defaults = [
    { name: 'Alappuzha', state: 'Kerala', population: 2100000, risk_level: 'severe', lat: 9.49, lng: 76.34 },
    { name: 'Majuli Island', state: 'Assam', population: 167000, risk_level: 'severe', lat: 26.95, lng: 94.17 },
    { name: 'Patna', state: 'Bihar', population: 2500000, risk_level: 'high', lat: 25.59, lng: 85.14 },
    { name: 'Cuttack', state: 'Odisha', population: 650000, risk_level: 'high', lat: 20.46, lng: 85.88 },
    { name: 'Surat', state: 'Gujarat', population: 7000000, risk_level: 'moderate', lat: 21.17, lng: 72.83 },
    { name: 'Kolkata', state: 'West Bengal', population: 15000000, risk_level: 'high', lat: 22.57, lng: 88.36 },
    { name: 'Hyderabad', state: 'Telangana', population: 10000000, risk_level: 'low', lat: 17.39, lng: 78.49 },
    { name: 'Chennai', state: 'Tamil Nadu', population: 11000000, risk_level: 'moderate', lat: 13.08, lng: 80.27 },
    { name: 'Guwahati', state: 'Assam', population: 960000, risk_level: 'high', lat: 26.14, lng: 91.74 },
    { name: 'Mumbai', state: 'Maharashtra', population: 20000000, risk_level: 'moderate', lat: 19.08, lng: 72.88 },
  ];

  const { data: existing } = await supabase.from('regions').select('id').limit(1);
  if (existing && existing.length > 0) {
    return fetchRegions();
  }

  const { data, error } = await supabase.from('regions').insert(defaults).select('*');
  if (error) throw new Error(error.message);
  return (data ?? []) as Region[];
}
