import type { FeatureVector, LabeledSample, PredictionResult } from './types';
import { DecisionTree } from './decisionTree';
import { sigmoid } from './utils';

export interface XGBoostOptions {
  nEstimators?: number;
  maxDepth?: number;
  learningRate?: number;
  minSamplesSplit?: number;
}

interface BoostTree {
  tree: DecisionTree;
  shrinkage: number;
}

export class XGBoost {
  private trees: BoostTree[] = [];
  private baseScore = 0;
  private nFeatures = 0;
  private learningRate: number;
  private nEstimators: number;
  private maxDepth: number;
  private minSamplesSplit: number;
  private importance: number[] = [];

  constructor(opts: XGBoostOptions = {}) {
    this.nEstimators = opts.nEstimators ?? 60;
    this.maxDepth = opts.maxDepth ?? 4;
    this.learningRate = opts.learningRate ?? 0.3;
    this.minSamplesSplit = opts.minSamplesSplit ?? 2;
  }

  train(samples: LabeledSample[]): void {
    if (samples.length === 0) return;
    this.nFeatures = samples[0].features.length;
    this.trees = [];
    this.importance = new Array(this.nFeatures).fill(0);

    const positives = samples.filter((s) => s.label === 1).length;
    const p = positives / samples.length;
    this.baseScore = Math.log(p / (1 - p + 1e-9) + 1e-9);

    let predictions = new Array(samples.length).fill(this.baseScore);

    for (let t = 0; t < this.nEstimators; t++) {
      const gradients = samples.map((s, i) => {
        const prob = sigmoid(predictions[i]);
        return s.label - prob;
      });

      const residualSamples: LabeledSample[] = samples.map((s, i) => ({
        features: s.features,
        label: gradients[i] > 0 ? 1 : 0,
      }));

      const weights = gradients.map((g) => Math.abs(g));
      const weightedSamples = this.weightedBootstrap(residualSamples, weights);

      const tree = new DecisionTree({
        maxDepth: this.maxDepth,
        minSamplesSplit: this.minSamplesSplit,
      });
      tree.train(weightedSamples);

      const treeImportance = tree.featureImportance();
      for (let i = 0; i < this.nFeatures; i++) {
        this.importance[i] += treeImportance[i] ?? 0;
      }

      this.trees.push({ tree, shrinkage: this.learningRate });

      predictions = predictions.map((pred, i) => {
        const treePred = tree.predict(samples[i].features).probability;
        return pred + this.learningRate * (treePred - 0.5) * 2;
      });
    }

    const total = this.importance.reduce((a, b) => a + b, 0);
    if (total > 0) {
      this.importance = this.importance.map((v) => v / total);
    }
  }

  private weightedBootstrap(
    samples: LabeledSample[],
    weights: number[],
  ): LabeledSample[] {
    const n = samples.length;
    const result: LabeledSample[] = [];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return samples;
    for (let i = 0; i < n; i++) {
      let r = Math.random() * totalWeight;
      let cum = 0;
      for (let j = 0; j < n; j++) {
        cum += weights[j];
        if (r <= cum) {
          result.push(samples[j]);
          break;
        }
      }
    }
    return result;
  }

  predict(features: FeatureVector): PredictionResult {
    let score = this.baseScore;
    for (const { tree, shrinkage } of this.trees) {
      const treePred = tree.predict(features).probability;
      score += shrinkage * (treePred - 0.5) * 2;
    }
    const probability = sigmoid(score);
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
