import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { trainAllModels, type TrainingResult } from '../ml/training';
import type { FeatureStats } from '../ml/types';
import { supabase } from './supabase';
import type { ModelMetricRecord, TrainingStatRecord } from './types';

interface ModelContextValue {
  training: TrainingResult | null;
  loading: boolean;
  error: string | null;
  retrain: () => void;
  persistedMetrics: ModelMetricRecord[];
  persistedStats: TrainingStatRecord[];
}

const ModelContext = createContext<ModelContextValue | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [training, setTraining] = useState<TrainingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [persistedMetrics, setPersistedMetrics] = useState<ModelMetricRecord[]>([]);
  const [persistedStats, setPersistedStats] = useState<TrainingStatRecord[]>([]);

  const runTraining = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        const result = trainAllModels();
        setTraining(result);
        void persistResults(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Training failed');
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  const persistResults = async (result: TrainingResult) => {
    try {
      await supabase.from('model_metrics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const metricRows = result.models.map((m) => ({
        model_name: m.name,
        accuracy: m.metrics.accuracy,
        precision: m.metrics.precision,
        recall: m.metrics.recall,
        f1_score: m.metrics.f1Score,
        training_samples: m.metrics.trainingSamples,
        test_samples: m.metrics.testSamples,
        is_best: m.isBest,
        trained_at: new Date().toISOString(),
      }));
      await supabase.from('model_metrics').insert(metricRows);

      await supabase.from('training_stats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const statRows = result.dataset.stats.map((s: FeatureStats) => ({
        feature_name: s.name,
        mean: s.mean,
        std: s.std,
        min: s.min,
        max: s.max,
        flood_positive_mean: s.floodPositiveMean,
        flood_negative_mean: s.floodNegativeMean,
      }));
      await supabase.from('training_stats').insert(statRows);

      const { data: metricsData } = await supabase
        .from('model_metrics')
        .select('*')
        .order('accuracy', { ascending: false });
      if (metricsData) setPersistedMetrics(metricsData as ModelMetricRecord[]);

      const { data: statsData } = await supabase
        .from('training_stats')
        .select('*')
        .order('feature_name', { ascending: true });
      if (statsData) setPersistedStats(statsData as TrainingStatRecord[]);
    } catch {
      // Persistence is best-effort; the app still works in-memory.
    }
  };

  useEffect(() => {
    runTraining();
  }, []);

  const value = useMemo<ModelContextValue>(
    () => ({
      training,
      loading,
      error,
      retrain: runTraining,
      persistedMetrics,
      persistedStats,
    }),
    [training, loading, error, persistedMetrics, persistedStats],
  );

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModel must be used within ModelProvider');
  return ctx;
}
