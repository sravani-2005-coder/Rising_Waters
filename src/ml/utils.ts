import type { FeatureVector, LabeledSample } from './types';

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function std(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function min(values: number[]): number {
  return values.length === 0 ? 0 : Math.min(...values);
}

export function max(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function trainTestSplit(
  samples: LabeledSample[],
  testRatio = 0.2,
): { train: LabeledSample[]; test: LabeledSample[] } {
  const shuffled = shuffle(samples);
  const splitIdx = Math.floor(shuffled.length * (1 - testRatio));
  return {
    train: shuffled.slice(0, splitIdx),
    test: shuffled.slice(splitIdx),
  };
}

export function euclideanDistance(a: FeatureVector, b: FeatureVector): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function standardizeFeatures(
  samples: LabeledSample[],
  means: number[],
  stds: number[],
): LabeledSample[] {
  return samples.map((s) => ({
    features: s.features.map((v, i) => (stds[i] === 0 ? 0 : (v - means[i]) / stds[i])),
    label: s.label,
  }));
}

export function computeFeatureMeans(samples: LabeledSample[]): number[] {
  if (samples.length === 0) return [];
  const dim = samples[0].features.length;
  const means: number[] = [];
  for (let i = 0; i < dim; i++) {
    means.push(mean(samples.map((s) => s.features[i])));
  }
  return means;
}

export function computeFeatureStds(samples: LabeledSample[]): number[] {
  if (samples.length === 0) return [];
  const dim = samples[0].features.length;
  const stds: number[] = [];
  for (let i = 0; i < dim; i++) {
    stds.push(std(samples.map((s) => s.features[i])));
  }
  return stds;
}

export function sigmoid(x: number): number {
  if (x >= 0) {
    const z = Math.exp(-x);
    return 1 / (1 + z);
  }
  const z = Math.exp(x);
  return z / (1 + z);
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
