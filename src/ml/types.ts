export type FeatureVector = number[];

export interface LabeledSample {
  features: FeatureVector;
  label: number; // 0 = no flood, 1 = flood
}

export interface Dataset {
  samples: LabeledSample[];
  featureNames: string[];
}

export interface ModelMetrics {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingSamples: number;
  testSamples: number;
  confusionMatrix: { tp: number; tn: number; fp: number; fn: number };
}

export interface PredictionResult {
  probability: number;
  label: number;
  confidence: number;
}

export interface TrainedModel {
  name: string;
  predict: (features: FeatureVector) => PredictionResult;
  train: (samples: LabeledSample[]) => void;
  featureImportance?: () => number[];
}

export interface FeatureStats {
  name: string;
  mean: number;
  std: number;
  min: number;
  max: number;
  floodPositiveMean: number;
  floodNegativeMean: number;
}

export const FEATURE_NAMES = [
  'annual_rainfall',
  'monsoon_intensity',
  'river_water_level',
  'soil_moisture',
  'cloud_visibility',
  'temperature',
  'humidity',
] as const;

export type FeatureName = (typeof FEATURE_NAMES)[number];
