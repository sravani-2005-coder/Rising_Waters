import type { FeatureVector, LabeledSample, PredictionResult } from './types';

interface TreeNode {
  isLeaf: boolean;
  prediction?: number;
  probability?: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

export interface DecisionTreeOptions {
  maxDepth?: number;
  minSamplesSplit?: number;
  minSamplesLeaf?: number;
}

export class DecisionTree {
  private root: TreeNode | null = null;
  private nFeatures = 0;
  private maxDepth: number;
  private minSamplesSplit: number;
  private minSamplesLeaf: number;
  private featureCounts: number[] = [];

  constructor(opts: DecisionTreeOptions = {}) {
    this.maxDepth = opts.maxDepth ?? 8;
    this.minSamplesSplit = opts.minSamplesSplit ?? 4;
    this.minSamplesLeaf = opts.minSamplesLeaf ?? 1;
  }

  train(samples: LabeledSample[]): void {
    if (samples.length === 0) return;
    this.nFeatures = samples[0].features.length;
    this.featureCounts = new Array(this.nFeatures).fill(0);
    this.root = this.buildTree(samples, 0);
  }

  private buildTree(samples: LabeledSample[], depth: number): TreeNode {
    const labels = samples.map((s) => s.label);
    const positives = labels.filter((l) => l === 1).length;
    const negatives = labels.length - positives;
    const probability = samples.length === 0 ? 0 : positives / samples.length;
    const prediction = positives >= negatives ? 1 : 0;

    const leaf: TreeNode = {
      isLeaf: true,
      prediction,
      probability,
    };

    if (
      depth >= this.maxDepth ||
      samples.length < this.minSamplesSplit ||
      positives === 0 ||
      negatives === 0
    ) {
      return leaf;
    }

    const best = this.findBestSplit(samples);
    if (!best) return leaf;

    const { featureIndex, threshold, leftSamples, rightSamples } = best;
    if (leftSamples.length < this.minSamplesLeaf || rightSamples.length < this.minSamplesLeaf) {
      return leaf;
    }

    this.featureCounts[featureIndex] += 1;

    return {
      isLeaf: false,
      featureIndex,
      threshold,
      left: this.buildTree(leftSamples, depth + 1),
      right: this.buildTree(rightSamples, depth + 1),
    };
  }

  private findBestSplit(samples: LabeledSample[]): {
    featureIndex: number;
    threshold: number;
    leftSamples: LabeledSample[];
    rightSamples: LabeledSample[];
  } | null {
    let bestGini = Infinity;
    let best: {
      featureIndex: number;
      threshold: number;
      leftSamples: LabeledSample[];
      rightSamples: LabeledSample[];
    } | null = null;

    for (let f = 0; f < this.nFeatures; f++) {
      const sorted = [...samples].sort((a, b) => a.features[f] - b.features[f]);
      const values = sorted.map((s) => s.features[f]);
      for (let i = 1; i < values.length; i++) {
        if (values[i] === values[i - 1]) continue;
        const threshold = (values[i] + values[i - 1]) / 2;
        const leftSamples = samples.filter((s) => s.features[f] <= threshold);
        const rightSamples = samples.filter((s) => s.features[f] > threshold);
        if (leftSamples.length === 0 || rightSamples.length === 0) continue;
        const gini = this.weightedGini(leftSamples, rightSamples);
        if (gini < bestGini) {
          bestGini = gini;
          best = { featureIndex: f, threshold, leftSamples, rightSamples };
        }
      }
    }

    return best;
  }

  private gini(samples: LabeledSample[]): number {
    if (samples.length === 0) return 0;
    const positives = samples.filter((s) => s.label === 1).length;
    const p = positives / samples.length;
    return 1 - p * p - (1 - p) * (1 - p);
  }

  private weightedGini(left: LabeledSample[], right: LabeledSample[]): number {
    const total = left.length + right.length;
    return (left.length / total) * this.gini(left) + (right.length / total) * this.gini(right);
  }

  private predictNode(node: TreeNode, features: FeatureVector): TreeNode {
    if (node.isLeaf) return node;
    if (features[node.featureIndex!] <= node.threshold!) {
      return this.predictNode(node.left!, features);
    }
    return this.predictNode(node.right!, features);
  }

  predict(features: FeatureVector): PredictionResult {
    if (!this.root) {
      return { probability: 0.5, label: 0, confidence: 0 };
    }
    const leaf = this.predictNode(this.root, features);
    const probability = leaf.probability ?? 0.5;
    return {
      probability,
      label: leaf.prediction ?? 0,
      confidence: Math.abs(probability - 0.5) * 2,
    };
  }

  featureImportance(): number[] {
    const total = this.featureCounts.reduce((a, b) => a + b, 0);
    if (total === 0) return new Array(this.nFeatures).fill(0);
    return this.featureCounts.map((c) => c / total);
  }
}
