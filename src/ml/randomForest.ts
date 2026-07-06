import type { FeatureVector, LabeledSample, PredictionResult } from './types';
import { DecisionTree } from './decisionTree';
import { shuffle } from './utils';

export interface RandomForestOptions {
  nEstimators?: number;
  maxDepth?: number;
  minSamplesSplit?: number;
  sampleRatio?: number;
  featureRatio?: number;
  randomState?: number;
}

export class RandomForest {
  private trees: DecisionTree[] = [];
  private featureIndices: number[][] = [];
  private nFeatures = 0;
  private nEstimators: number;
  private maxDepth: number;
  private minSamplesSplit: number;
  private sampleRatio: number;
  private featureRatio: number;
  private importance: number[] = [];

  constructor(opts: RandomForestOptions = {}) {
    this.nEstimators = opts.nEstimators ?? 25;
    this.maxDepth = opts.maxDepth ?? 10;
    this.minSamplesSplit = opts.minSamplesSplit ?? 2;
    this.sampleRatio = opts.sampleRatio ?? 0.8;
    this.featureRatio = opts.featureRatio ?? 0.7;
  }

  train(samples: LabeledSample[]): void {
    if (samples.length === 0) return;
    this.nFeatures = samples[0].features.length;
    this.trees = [];
    this.featureIndices = [];
    this.importance = new Array(this.nFeatures).fill(0);

    for (let t = 0; t < this.nEstimators; t++) {
      const bootstrap = this.bootstrapSample(samples);
      const featureIdx = this.selectFeatures();
      const projected = bootstrap.map((s) => ({
        features: featureIdx.map((i) => s.features[i]),
        label: s.label,
      }));
      const tree = new DecisionTree({
        maxDepth: this.maxDepth,
        minSamplesSplit: this.minSamplesSplit,
      });
      tree.train(projected);
      this.trees.push(tree);
      this.featureIndices.push(featureIdx);

      const treeImportance = tree.featureImportance();
      for (let i = 0; i < featureIdx.length; i++) {
        this.importance[featureIdx[i]] += treeImportance[i] ?? 0;
      }
    }

    const total = this.importance.reduce((a, b) => a + b, 0);
    if (total > 0) {
      this.importance = this.importance.map((v) => v / total);
    }
  }

  private bootstrapSample(samples: LabeledSample[]): LabeledSample[] {
    const n = Math.floor(samples.length * this.sampleRatio);
    const result: LabeledSample[] = [];
    for (let i = 0; i < n; i++) {
      result.push(samples[Math.floor(Math.random() * samples.length)]);
    }
    return result;
  }

  private selectFeatures(): number[] {
    const all = Array.from({ length: this.nFeatures }, (_, i) => i);
    const shuffled = shuffle(all);
    const count = Math.max(1, Math.floor(this.nFeatures * this.featureRatio));
    return shuffled.slice(0, count).sort((a, b) => a - b);
  }

  predict(features: FeatureVector): PredictionResult {
    if (this.trees.length === 0) {
      return { probability: 0.5, label: 0, confidence: 0 };
    }
    let sum = 0;
    for (let t = 0; t < this.trees.length; t++) {
      const projected = this.featureIndices[t].map((i) => features[i]);
      const r = this.trees[t].predict(projected);
      sum += r.probability;
    }
    const probability = sum / this.trees.length;
    return {
      probability,
      label: probability >= 0.5 ? 1 : 0,
      confidence: Math.abs(probability - 0.5) * 2,
    };
  }

  featureImportance(): number[] {
    return [...this.importance];
  }
}
