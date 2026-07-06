import type { LabeledSample, ModelMetrics, TrainedModel, PredictionResult, FeatureVector } from './types';
import { DecisionTree } from './decisionTree';
import { RandomForest } from './randomForest';
import { KNN } from './knn';
import { XGBoost } from './xgboost';
import { generateDataset, type GeneratedDataset } from './dataGenerator';
import { trainTestSplit, standardizeFeatures, computeFeatureMeans, computeFeatureStds } from './utils';

export interface TrainedModelBundle {
  name: string;
  model: TrainedModel;
  metrics: ModelMetrics;
  isBest: boolean;
}

export interface TrainingResult {
  models: TrainedModelBundle[];
  bestModel: TrainedModelBundle;
  dataset: GeneratedDataset;
  standardization: { means: number[]; stds: number[] };
}

function evaluate(
  model: { predict: (f: FeatureVector) => PredictionResult },
  testSamples: LabeledSample[],
): ModelMetrics['confusionMatrix'] & { accuracy: number; precision: number; recall: number; f1Score: number } {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  for (const s of testSamples) {
    const pred = model.predict(s.features);
    if (pred.label === 1 && s.label === 1) tp++;
    else if (pred.label === 0 && s.label === 0) tn++;
    else if (pred.label === 1 && s.label === 0) fp++;
    else if (pred.label === 0 && s.label === 1) fn++;
  }
  const accuracy = (tp + tn) / (tp + tn + fp + fn || 1);
  const precision = tp / (tp + fp || 1);
  const recall = tp / (tp + fn || 1);
  const f1Score = (2 * precision * recall) / (precision + recall || 1);
  return { tp, tn, fp, fn, accuracy, precision, recall, f1Score };
}

export function trainAllModels(): TrainingResult {
  const dataset = generateDataset(1200);
  const { train, test } = trainTestSplit(dataset.samples, 0.2);

  const means = computeFeatureMeans(train);
  const stds = computeFeatureStds(train);
  const trainStd = standardizeFeatures(train, means, stds);
  const testStd = standardizeFeatures(test, means, stds);

  const dt = new DecisionTree({ maxDepth: 8, minSamplesSplit: 4 });
  dt.train(trainStd);

  const rf = new RandomForest({
    nEstimators: 30,
    maxDepth: 10,
    minSamplesSplit: 2,
    sampleRatio: 0.8,
    featureRatio: 0.7,
  });
  rf.train(trainStd);

  const knn = new KNN({ k: 15, weighted: true });
  knn.train(trainStd);

  const xgb = new XGBoost({
    nEstimators: 60,
    maxDepth: 4,
    learningRate: 0.3,
  });
  xgb.train(trainStd);

  const wrap = (name: string, m: { predict: (f: FeatureVector) => PredictionResult }): TrainedModelBundle => {
    const e = evaluate(m, testStd);
    return {
      name,
      model: {
        name,
        predict: (features: FeatureVector) => {
          const stdFeatures = features.map((v, i) => (stds[i] === 0 ? 0 : (v - means[i]) / stds[i]));
          return m.predict(stdFeatures);
        },
        train: () => {},
      },
      metrics: {
        modelName: name,
        accuracy: e.accuracy,
        precision: e.precision,
        recall: e.recall,
        f1Score: e.f1Score,
        trainingSamples: train.length,
        testSamples: test.length,
        confusionMatrix: { tp: e.tp, tn: e.tn, fp: e.fp, fn: e.fn },
      },
      isBest: false,
    };
  };

  const bundles = [
    wrap('Decision Tree', dt),
    wrap('Random Forest', rf),
    wrap('KNN', knn),
    wrap('XGBoost', xgb),
  ];

  let best = bundles[0];
  for (const b of bundles) {
    if (b.metrics.accuracy > best.metrics.accuracy) best = b;
  }
  best.isBest = true;

  return {
    models: bundles,
    bestModel: best,
    dataset,
    standardization: { means, stds },
  };
}
