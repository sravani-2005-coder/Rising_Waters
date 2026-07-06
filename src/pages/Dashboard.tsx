import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  Database,
  ShieldCheck,
  CloudRain,
  MapPin,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { RiskGauge } from '../components/RiskGauge';
import { RiskBadge } from '../components/RiskBadge';
import { useModel } from '../lib/modelContext';
import { fetchPredictions, fetchRegions, seedDefaultRegions } from '../lib/predictionService';
import { classifyRisk, type PredictionRecord, type Region } from '../lib/types';
import type { PageId } from '../components/Layout';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { training, loading, error } = useModel();
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    void loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      await seedDefaultRegions();
      const [preds, regs] = await Promise.all([fetchPredictions(50), fetchRegions()]);
      setPredictions(preds);
      setRegions(regs);
    } catch {
      // ignore - dashboard still renders with empty state
    }
  };

  if (loading || !training) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Loading model and recent activity..." icon={<LayoutDashboard className="w-6 h-6" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle={error} icon={<LayoutDashboard className="w-6 h-6" />} />
      </div>
    );
  }

  const best = training.bestModel;
  const totalPredictions = predictions.length;
  const highRiskCount = predictions.filter((p) => p.risk_level === 'high' || p.risk_level === 'severe').length;
  const avgProbability = totalPredictions > 0
    ? predictions.reduce((sum, p) => sum + p.flood_probability, 0) / totalPredictions
    : 0;
  const recent = predictions.slice(0, 5);
  const monitoredRegions = regions.length;
  const datasetSize = training.dataset.samples.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time flood risk intelligence powered by machine learning. Monitor conditions, review recent predictions, and assess model readiness."
        icon={<LayoutDashboard className="w-6 h-6" />}
        actions={
          <button onClick={() => onNavigate('predict')} className="btn-primary">
            <Zap className="w-4 h-4" />
            New Prediction
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Best Model Accuracy"
          value={`${(best.metrics.accuracy * 100).toFixed(2)}%`}
          sublabel={best.name}
          icon={<ShieldCheck className="w-4 h-4" />}
          accent="aqua"
          trend={{ direction: 'up', value: `${(best.metrics.f1Score * 100).toFixed(1)}% F1` }}
        />
        <StatCard
          label="Predictions Logged"
          value={totalPredictions}
          sublabel="All time"
          icon={<Activity className="w-4 h-4" />}
          accent="storm"
        />
        <StatCard
          label="High-Risk Alerts"
          value={highRiskCount}
          sublabel="Last 50 predictions"
          icon={<CloudRain className="w-4 h-4" />}
          accent={highRiskCount > 5 ? 'red' : 'orange'}
        />
        <StatCard
          label="Regions Monitored"
          value={monitoredRegions}
          sublabel="Active watchlist"
          icon={<MapPin className="w-4 h-4" />}
          accent="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Average Risk</h3>
            <span className="text-xs text-slate-500">Recent predictions</span>
          </div>
          <div className="flex flex-col items-center py-4">
            <RiskGauge probability={avgProbability || 0.25} size={200} />
            <p className="text-sm text-slate-400 text-center mt-4 max-w-xs">
              {totalPredictions > 0
                ? `Based on ${totalPredictions} recent prediction${totalPredictions === 1 ? '' : 's'}.`
                : 'No predictions yet. Run your first forecast from the Predict page.'}
            </p>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-white">Recent Predictions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest forecasts from the field</p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-aqua-400 hover:text-aqua-300 flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-ink-800 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No predictions yet</p>
              <button onClick={() => onNavigate('predict')} className="btn-ghost mt-4 text-xs">
                Run first prediction
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((p) => {
                const risk = classifyRisk(p.flood_probability);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-ink-800/40 hover:bg-ink-800/70 transition-colors border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${risk.color}15`, color: risk.color }}>
                      <CloudRain className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm truncate">
                          {p.region_name ?? 'Unassigned region'}
                        </span>
                        <RiskBadge probability={p.flood_probability} size="sm" />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.model_used} · {(p.flood_probability * 100).toFixed(1)}% · {new Date(p.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-aqua-400" />
            <h3 className="font-display font-semibold text-white">Training Dataset</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total samples</span>
              <span className="text-white font-mono tabular-nums">{datasetSize.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Features</span>
              <span className="text-white font-mono tabular-nums">{training.dataset.featureNames.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Flood-positive</span>
              <span className="text-white font-mono tabular-nums">
                {training.dataset.samples.filter((s) => s.label === 1).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Test split</span>
              <span className="text-white font-mono tabular-nums">20%</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <h3 className="font-display font-semibold text-white">Model Performance</h3>
          </div>
          <div className="space-y-2.5">
            {training.models.map((m) => (
              <div key={m.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {m.isBest && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">BEST</span>}
                  <span className="text-sm text-slate-300">{m.name}</span>
                </div>
                <span className="text-sm font-mono tabular-nums text-white">
                  {(m.metrics.accuracy * 100).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('models')}
            className="btn-ghost w-full mt-4 text-xs"
          >
            Compare models <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="card p-6 bg-gradient-to-br from-aqua-500/10 to-storm-500/5 border-aqua-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-aqua-400" />
            <h3 className="font-display font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <button onClick={() => onNavigate('predict')} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group">
              <div>
                <div className="text-sm font-medium text-white">Run a prediction</div>
                <div className="text-xs text-slate-500">Enter weather readings</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-aqua-400 group-hover:translate-x-0.5 transition-all" />
            </button>
            <button onClick={() => onNavigate('monitor')} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group">
              <div>
                <div className="text-sm font-medium text-white">Monitor regions</div>
                <div className="text-xs text-slate-500">Multi-region watchlist</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-aqua-400 group-hover:translate-x-0.5 transition-all" />
            </button>
            <button onClick={() => onNavigate('analytics')} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group">
              <div>
                <div className="text-sm font-medium text-white">Explore analytics</div>
                <div className="text-xs text-slate-500">Dataset insights</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-aqua-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
