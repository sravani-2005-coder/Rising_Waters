import type { LabeledSample, FeatureStats } from './types';
import { FEATURE_NAMES } from './types';
import { mean, std, min, max } from './utils';

export interface WeatherInput {
  annual_rainfall: number;
  monsoon_intensity: number;
  river_water_level: number;
  soil_moisture: number;
  cloud_visibility: number;
  temperature: number;
  humidity: number;
}

export interface GeneratedDataset {
  samples: LabeledSample[];
  featureNames: string[];
  stats: FeatureStats[];
}

function gaussian(mean: number, stdDev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function floodProbability(features: number[]): number {
  const [rainfall, monsoon, river, soil, cloud, , humidity] = features;
  const score =
    0.30 * (rainfall / 2200) +
    0.25 * (monsoon / 100) +
    0.20 * (river / 12) +
    0.15 * (soil / 100) +
    0.05 * (1 - cloud / 10) +
    0.05 * (humidity / 100);
  return Math.max(0, Math.min(1, score));
}

export function generateDataset(n = 1200): GeneratedDataset {
  const samples: LabeledSample[] = [];

  for (let i = 0; i < n; i++) {
    const isFloodProne = Math.random() < 0.45;

    const annualRainfall = isFloodProne
      ? gaussian(1900, 350)
      : gaussian(1100, 280);
    const monsoonIntensity = isFloodProne
      ? gaussian(78, 14)
      : gaussian(42, 12);
    const riverWaterLevel = isFloodProne
      ? gaussian(9.2, 1.6)
      : gaussian(5.1, 1.3);
    const soilMoisture = isFloodProne
      ? gaussian(82, 9)
      : gaussian(48, 11);
    const cloudVisibility = isFloodProne
      ? gaussian(2.1, 0.8)
      : gaussian(7.4, 1.2);
    const temperature = isFloodProne
      ? gaussian(26, 3)
      : gaussian(31, 4);
    const humidity = isFloodProne
      ? gaussian(88, 6)
      : gaussian(58, 9);

    const features = [
      Math.max(0, annualRainfall),
      Math.max(0, monsoonIntensity),
      Math.max(0, riverWaterLevel),
      Math.max(0, Math.min(100, soilMoisture)),
      Math.max(0, cloudVisibility),
      Math.max(0, temperature),
      Math.max(0, Math.min(100, humidity)),
    ];

    const prob = floodProbability(features);
    const noise = (Math.random() - 0.5) * 0.12;
    const finalProb = Math.max(0, Math.min(1, prob + noise));
    const label = finalProb >= 0.5 ? 1 : 0;

    samples.push({ features, label });
  }

  const stats: FeatureStats[] = FEATURE_NAMES.map((name, i) => {
    const values = samples.map((s) => s.features[i]);
    const posValues = samples.filter((s) => s.label === 1).map((s) => s.features[i]);
    const negValues = samples.filter((s) => s.label === 0).map((s) => s.features[i]);
    return {
      name,
      mean: mean(values),
      std: std(values),
      min: min(values),
      max: max(values),
      floodPositiveMean: posValues.length ? mean(posValues) : 0,
      floodNegativeMean: negValues.length ? mean(negValues) : 0,
    };
  });

  return {
    samples,
    featureNames: [...FEATURE_NAMES],
    stats,
  };
}

export function inputToFeatures(input: WeatherInput): number[] {
  return [
    input.annual_rainfall,
    input.monsoon_intensity,
    input.river_water_level,
    input.soil_moisture,
    input.cloud_visibility,
    input.temperature,
    input.humidity,
  ];
}

export function featuresToInput(features: number[]): WeatherInput {
  return {
    annual_rainfall: features[0],
    monsoon_intensity: features[1],
    river_water_level: features[2],
    soil_moisture: features[3],
    cloud_visibility: features[4],
    temperature: features[5],
    humidity: features[6],
  };
}
