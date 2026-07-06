import { useState } from 'react';
import {
  Cpu,
  Trophy,
  RefreshCw,
  GitBranch,
  Trees,
  Users,
  Zap,
  Target,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { BarChart } from '../components/BarChart';
import { useModel } from '../lib/modelContext';

const MODEL_META: Record<string, { icon: typeof Cpu; description: string; color: string }> = {
  'Decision Tree': {
    icon: GitBranch,
    description: 'Single tree splitting on Gini-impurity thresholds. Fast and interpretable.',
    color: 'linear-gradient(180deg, #22d3ee, #0891b2)',
  },
  'Random Forest': {
    icon: Trees,
    description: 'Bagged ensemble of decision trees with random feature subsets. Reduces overfitting.',
    color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
  },
  KNN: {
    icon: Users,
    description: 'Distance-weighted k-nearest neighbours. Lazy learner, no explicit training.',
    color: 'linear-gradient(180deg, #a78bfa, #7c3aed)',
  },
  XGBoost: {
    icon: Zap,
    description: 'Gradient-boosted trees with logistic loss. Sequential correction of residuals.',
    color: 'linear-gradient(180deg, #f97316, #c2410c)',
  },
};

export function Models() {
  const { training, loading, retrain } = useModel();
  const [retraining, setRetraining] = useState(false);

  if (loading || !training) {
    return (
      <div>
        <PageHeader title="Models" subtitle="Loading..." icon={<Cpu className="w-6 h-6" />} />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  const handleRetrain = () => {
    setRetraining(true);
    retrain();
    setTimeout(() => setRetraining(false), 1500);
  };

  const sorted = [...training.models].sort((a, b) => b.metrics.accuracy - a.metrics.accuracy);
  const best = training.bestModel;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model Performance"
        subtitle="Four classification algorithms trained on the same historical weather dataset. Compare accuracy, precision, recall, and F1 to understand each model's strengths."
        icon={<Cpu className="w-6 h-6" />}
        actions={
          <button onClick={handleRetrain} disabled={retraining} className="btn-ghost">
            <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? 'Retraining...' : 'Retrain'}
          </button>
        }
      />

      <div className="card p-6 bg-gradient-to-br from-aqua-500/10 to-storm-500/5 border-aqua-500/20">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-aqua-500 to-storm-600 flex items-center justify-center shadow-lg shadow-aqua-500/30">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-aqua-400 font-medium">Best Performing Model</div>
              <h2 className="font-display text-2xl font-bold text-white">{best.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {(best.metrics.accuracy * 100).toFixed(2)}% accuracy on test data
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-white tabular-nums">
                {(best.metrics.precision * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">Precision</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-white tabular-nums">
                {(best.metrics.recall * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">Recall</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-white tabular-nums">
                {(best.metrics.f1Score * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">F1 Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sorted.map((m) => {
          const meta = MODEL_META[m.name];
          const Icon = meta?.icon ?? Cpu;
          const cm = m.metrics.confusionMatrix;
          return (
            <div key={m.name} className={`card p-6 ${m.isBest ? 'border-aqua-500/30' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg"
                    style={{ background: meta?.color }}
                  >
                    <Icon className="w-5.5 h-5.5" size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-white text-lg">{m.name}</h3>
                      {m.isBest && (
                        <span className="badge bg-aqua-500/15 border-aqua-500/30 text-aqua-400">
                          <Trophy className="w-3 h-3" />
                          Best
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xs">{meta?.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-display font-bold text-white tabular-nums">
                    {(m.metrics.accuracy * 100).toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-500">Accuracy</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                  <div className="text-xs text-slate-500">Precision</div>
                  <div className="text-lg font-display font-semibold text-white tabular-nums mt-0.5">
                    {(m.metrics.precision * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                  <div className="text-xs text-slate-500">Recall</div>
                  <div className="text-lg font-display font-semibold text-white tabular-nums mt-0.5">
                    {(m.metrics.recall * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                  <div className="text-xs text-slate-500">F1</div>
                  <div className="text-lg font-display font-semibold text-white tabular-nums mt-0.5">
                    {(m.metrics.f1Score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-slate-500 mb-2">Confusion Matrix</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-1.5 text-green-400 text-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      True Positives
                    </div>
                    <div className="text-xl font-display font-bold text-white tabular-nums mt-1">{cm.tp}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-1.5 text-green-400 text-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      True Negatives
                    </div>
                    <div className="text-xl font-display font-bold text-white tabular-nums mt-1">{cm.tn}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-1.5 text-red-400 text-xs">
                      <XCircle className="w-3 h-3" />
                      False Positives
                    </div>
                    <div className="text-xl font-display font-bold text-white tabular-nums mt-1">{cm.fp}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-1.5 text-red-400 text-xs">
                      <XCircle className="w-3 h-3" />
                      False Negatives
                    </div>
                    <div className="text-xl font-display font-bold text-white tabular-nums mt-1">{cm.fn}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-500 pt-3 border-t border-white/5">
                <span>Train: {m.metrics.trainingSamples} samples</span>
                <span>Test: {m.metrics.testSamples} samples</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-aqua-400" />
          <h3 className="font-display font-semibold text-white">Accuracy Comparison</h3>
        </div>
        <p className="text-xs text-slate-500 mb-5">Test-set accuracy across all four models</p>
        <BarChart
          data={sorted.map((m) => ({
            label: m.name,
            value: m.metrics.accuracy * 100,
            color: MODEL_META[m.name]?.color,
          }))}
          valueFormat={(v) => `${v.toFixed(2)}%`}
          height={240}
        />
      </div>
    </div>
  );
}
