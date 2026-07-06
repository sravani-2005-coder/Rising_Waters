import { useEffect, useState } from 'react';
import {
  BarChart3,
  Database,
  TrendingUp,
  Sigma,
  Boxes,
  CloudRain,
  Droplets,
  Thermometer,
  Wind,
  Waves,
  Gauge,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { BarChart } from '../components/BarChart';
import { LineChart } from '../components/LineChart';
import { useModel } from '../lib/modelContext';
import { fetchPredictions } from '../lib/predictionService';
import { type PredictionRecord } from '../lib/types';
import type { FeatureStats } from '../ml/types';

const FEATURE_ICONS: Record<string, typeof CloudRain> = {
  annual_rainfall: CloudRain,
  monsoon_intensity: Waves,
  river_water_level: Droplets,
  soil_moisture: Gauge,
  cloud_visibility: Wind,
  temperature: Thermometer,
  humidity: Droplets,
};

const FEATURE_LABELS: Record<string, string> = {
  annual_rainfall: 'Annual Rainfall',
  monsoon_intensity: 'Monsoon Intensity',
  river_water_level: 'River Water Level',
  soil_moisture: 'Soil Moisture',
  cloud_visibility: 'Cloud Visibility',
  temperature: 'Temperature',
  humidity: 'Humidity',
};

export function Analytics() {
  const { training, loading } = useModel();
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      const data = await fetchPredictions(200);
      setPredictions(data);
    } catch {
      // ignore
    }
  };

  if (loading || !training) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Loading..." icon={<BarChart3 className="w-6 h-6" />} />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  const stats = training.dataset.stats;
  const totalSamples = training.dataset.samples.length;
  const floodPos = training.dataset.samples.filter((s) => s.label === 1).length;
  const floodNeg = totalSamples - floodPos;

  const riskDistribution = (['low', 'moderate', 'high', 'severe'] as const).map((level) => ({
    label: level.charAt(0).toUpperCase() + level.slice(1),
    value: predictions.filter((p) => p.risk_level === level).length,
    color: level === 'severe' ? 'linear-gradient(180deg, #dc2626, #991b1b)'
      : level === 'high' ? 'linear-gradient(180deg, #f97316, #c2410c)'
      : level === 'moderate' ? 'linear-gradient(180deg, #eab308, #a16207)'
      : 'linear-gradient(180deg, #22c55e, #15803d)',
  }));

  const trendData = predictions
    .slice()
    .reverse()
    .slice(-20)
    .map((p, i) => ({
      label: `#${i + 1}`,
      value: p.flood_probability,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dataset Analytics"
        subtitle="Understand the training data and prediction patterns. Feature distributions, class balance, and live prediction trends."
        icon={<BarChart3 className="w-6 h-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Total Samples</span>
            <Database className="w-4 h-4 text-aqua-400" />
          </div>
          <div className="font-display text-3xl font-bold text-white tabular-nums">{totalSamples.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Synthetic historical data</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Flood Events</span>
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
          <div className="font-display text-3xl font-bold text-white tabular-nums">{floodPos.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">{((floodPos / totalSamples) * 100).toFixed(1)}% of dataset</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">No-Flood</span>
            <Boxes className="w-4 h-4 text-green-400" />
          </div>
          <div className="font-display text-3xl font-bold text-white tabular-nums">{floodNeg.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">{((floodNeg / totalSamples) * 100).toFixed(1)}% of dataset</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Features</span>
            <Sigma className="w-4 h-4 text-storm-400" />
          </div>
          <div className="font-display text-3xl font-bold text-white tabular-nums">{stats.length}</div>
          <div className="text-xs text-slate-500 mt-1">Meteorological inputs</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-semibold text-white mb-1">Class Balance</h3>
          <p className="text-xs text-slate-500 mb-5">Flood vs no-flood samples in training data</p>
          <div className="flex items-center gap-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="-rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="12"
                  strokeDasharray={`${(floodPos / totalSamples) * 251.3} 251.3`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-display font-bold text-white tabular-nums">
                  {((floodPos / totalSamples) * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-slate-500">Flood</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-300">Flood events</span>
                </div>
                <span className="text-sm font-mono text-white tabular-nums">{floodPos}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-slate-300">No flood</span>
                </div>
                <span className="text-sm font-mono text-white tabular-nums">{floodNeg}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-semibold text-white mb-1">Prediction Risk Distribution</h3>
          <p className="text-xs text-slate-500 mb-5">Recent {predictions.length} predictions by risk level</p>
          {predictions.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">No predictions yet</div>
          ) : (
            <BarChart data={riskDistribution} valueFormat={(v) => v.toString()} height={200} />
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display font-semibold text-white mb-1">Feature Statistics</h3>
        <p className="text-xs text-slate-500 mb-5">Distribution of each meteorological feature across the training dataset</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/5">
                <th className="py-3 pr-4 font-medium">Feature</th>
                <th className="py-3 px-4 font-medium text-right">Mean</th>
                <th className="py-3 px-4 font-medium text-right">Std Dev</th>
                <th className="py-3 px-4 font-medium text-right">Min</th>
                <th className="py-3 px-4 font-medium text-right">Max</th>
                <th className="py-3 px-4 font-medium text-right">Flood Mean</th>
                <th className="py-3 pl-4 font-medium text-right">No-Flood Mean</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s: FeatureStats) => {
                const Icon = FEATURE_ICONS[s.name] ?? CloudRain;
                return (
                  <tr key={s.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-ink-800 border border-white/10 flex items-center justify-center text-aqua-400">
                          <Icon className="w-4 h-4" size={16} />
                        </div>
                        <span className="text-slate-200 font-medium">{FEATURE_LABELS[s.name] ?? s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300 tabular-nums">{s.mean.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 tabular-nums">{s.std.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">{s.min.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">{s.max.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-red-400 tabular-nums">{s.floodPositiveMean.toFixed(2)}</td>
                    <td className="py-3 pl-4 text-right font-mono text-green-400 tabular-nums">{s.floodNegativeMean.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-semibold text-white mb-1">Flood vs No-Flood Feature Means</h3>
          <p className="text-xs text-slate-500 mb-5">How each feature differs between flood and no-flood samples</p>
          <div className="space-y-4">
            {stats.map((s: FeatureStats) => {
              const max = Math.max(s.floodPositiveMean, s.floodNegativeMean, 0.0001);
              return (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">{FEATURE_LABELS[s.name] ?? s.name}</span>
                    <span className="text-slate-500">
                      Δ {((s.floodPositiveMean - s.floodNegativeMean) / (s.floodNegativeMean || 1) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-red-400 w-12">Flood</span>
                      <div className="flex-1 h-2 bg-ink-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400" style={{ width: `${(s.floodPositiveMean / max) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 w-14 text-right tabular-nums">{s.floodPositiveMean.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-green-400 w-12">No flood</span>
                      <div className="flex-1 h-2 bg-ink-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${(s.floodNegativeMean / max) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 w-14 text-right tabular-nums">{s.floodNegativeMean.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-semibold text-white mb-1">Prediction Probability Trend</h3>
          <p className="text-xs text-slate-500 mb-5">Last {Math.min(20, predictions.length)} predictions over time</p>
          {trendData.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">No predictions yet</div>
          ) : (
            <LineChart data={trendData} valueFormat={(v) => `${(v * 100).toFixed(1)}%`} color="#22d3ee" />
          )}
        </div>
      </div>
    </div>
  );
}
