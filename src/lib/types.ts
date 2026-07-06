export interface Region {
  id: string;
  name: string;
  state: string | null;
  population: number | null;
  risk_level: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface PredictionRecord {
  id: string;
  region_id: string | null;
  region_name: string | null;
  annual_rainfall: number;
  cloud_visibility: number;
  monsoon_intensity: number;
  river_water_level: number;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  flood_probability: number;
  flood_predicted: boolean;
  risk_level: string;
  model_used: string;
  notes: string | null;
  created_at: string;
}

export interface ModelMetricRecord {
  id: string;
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_samples: number;
  test_samples: number;
  is_best: boolean;
  trained_at: string;
  created_at: string;
}

export interface TrainingStatRecord {
  id: string;
  feature_name: string;
  mean: number;
  std: number;
  min: number;
  max: number;
  flood_positive_mean: number;
  flood_negative_mean: number;
  created_at: string;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface RiskClassification {
  level: RiskLevel;
  label: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  description: string;
}

export function classifyRisk(probability: number): RiskClassification {
  if (probability >= 0.8) {
    return {
      level: 'severe',
      label: 'Severe',
      color: '#dc2626',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      description: 'Catastrophic flooding expected. Immediate evacuation required.',
    };
  }
  if (probability >= 0.6) {
    return {
      level: 'high',
      label: 'High',
      color: '#f97316',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      description: 'Major flooding likely. Issue evacuation advisories.',
    };
  }
  if (probability >= 0.35) {
    return {
      level: 'moderate',
      label: 'Moderate',
      color: '#eab308',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      description: 'Localised flooding possible. Maintain readiness.',
    };
  }
  return {
    level: 'low',
    label: 'Low',
    color: '#22c55e',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    description: 'No significant flood risk expected.',
  };
}
