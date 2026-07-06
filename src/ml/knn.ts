import type { FeatureVector, LabeledSample, PredictionResult } from './types';
import { euclideanDistance } from './utils';

export interface KNNOptions {
  k?: number;
  weighted?: boolean;
}

export class KNN {
  private samples: LabeledSample[] = [];
  private k: number;
  private weighted: boolean;

  constructor(opts: KNNOptions = {}) {
    this.k = opts.k ?? 15;
    this.weighted = opts.weighted ?? true;
  }

  train(samples: LabeledSample[]): void {
    this.samples = samples;
  }

  predict(features: FeatureVector): PredictionResult {
    if (this.samples.length === 0) {
      return { probability: 0.5, label: 0, confidence: 0 };
    }
    const distances = this.samples.map((s) => ({
      dist: euclideanDistance(features, s.features),
      label: s.label,
    }));
    distances.sort((a, b) => a.dist - b.dist);
    const k = Math.min(this.k, distances.length);
    const neighbors = distances.slice(0, k);

    let positiveWeight = 0;
    let totalWeight = 0;
    for (const n of neighbors) {
      const w = this.weighted ? 1 / (n.dist + 1e-6) : 1;
      totalWeight += w;
      if (n.label === 1) positiveWeight += w;
    }
    const probability = totalWeight === 0 ? 0.5 : positiveWeight / totalWeight;
    return {
      probability,
      label: probability >= 0.5 ? 1 : 0,
      confidence: Math.abs(probability - 0.5) * 2,
    };
  }
}
