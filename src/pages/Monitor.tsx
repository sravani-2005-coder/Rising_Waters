import { useEffect, useState } from 'react';
import {
  Radar,
  MapPin,
  Plus,
  Trash2,
  RefreshCw,
  CloudRain,
  Users,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { RiskBadge } from '../components/RiskBadge';
import { useModel } from '../lib/modelContext';
import {
  fetchRegions,
  createRegion,
  deleteRegion,
  seedDefaultRegions,
  runPrediction,
} from '../lib/predictionService';
import { classifyRisk, type Region, type PredictionRecord } from '../lib/types';
import { inputToFeatures, type WeatherInput } from '../ml/dataGenerator';

interface MonitorProps {
  onPredicted: () => void;
}

interface RegionStatus {
  region: Region;
  latestPrediction: PredictionRecord | null;
  liveProbability: number;
}

const DEFAULT_READINGS: WeatherInput = {
  annual_rainfall: 1600,
  monsoon_intensity: 65,
  river_water_level: 7.5,
  soil_moisture: 70,
  cloud_visibility: 3.5,
  temperature: 27,
  humidity: 80,
};

export function Monitor({ onPredicted }: MonitorProps) {
  const { training, loading } = useModel();
  const [regions, setRegions] = useState<Region[]>([]);
  const [statuses, setStatuses] = useState<RegionStatus[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newRegion, setNewRegion] = useState({ name: '', state: '', population: '', risk_level: 'moderate' });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      await seedDefaultRegions();
      const regs = await fetchRegions();
      setRegions(regs);
      await refreshStatuses(regs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load regions');
    }
  };

  const refreshStatuses = async (regs: Region[]) => {
    if (!training) return;
    setRefreshing(true);
    try {
      const statuses: RegionStatus[] = regs.map((region) => {
        const features = inputToFeatures(DEFAULT_READINGS);
        const result = training.bestModel.model.predict(features);
        return {
          region,
          latestPrediction: null,
          liveProbability: result.probability,
        };
      });
      setStatuses(statuses);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAdd = async () => {
    if (!newRegion.name || !newRegion.state) return;
    try {
      const r = await createRegion({
        name: newRegion.name,
        state: newRegion.state,
        population: parseInt(newRegion.population) || null,
        risk_level: newRegion.risk_level,
        lat: null,
        lng: null,
      });
      setRegions((prev) => [...prev, r].sort((a, b) => a.name.localeCompare(b.name)));
      setNewRegion({ name: '', state: '', population: '', risk_level: 'moderate' });
      setShowAdd(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add region');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRegion(id);
      setRegions((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete region');
    }
  };

  const handleAssess = async (region: Region) => {
    if (!training) return;
    try {
      await runPrediction(
        {
          ...DEFAULT_READINGS,
          regionId: region.id,
          regionName: region.name,
          notes: `Routine monitoring assessment for ${region.name}`,
        },
        training,
      );
      onPredicted();
      const features = inputToFeatures(DEFAULT_READINGS);
      const result = training.bestModel.model.predict(features);
      setStatuses((prev) =>
        prev.map((s) =>
          s.region.id === region.id ? { ...s, liveProbability: result.probability } : s,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assessment failed');
    }
  };

  if (loading || !training) {
    return (
      <div>
        <PageHeader title="Monitor" subtitle="Loading..." icon={<Radar className="w-6 h-6" />} />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  const highRisk = statuses.filter((s) => s.liveProbability >= 0.6).length;
  const moderateRisk = statuses.filter((s) => s.liveProbability >= 0.35 && s.liveProbability < 0.6).length;
  const lowRisk = statuses.filter((s) => s.liveProbability < 0.35).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Region Monitor"
        subtitle="Track multiple flood-prone districts simultaneously. Each region is assessed against current default weather readings to surface the highest-risk areas."
        icon={<Radar className="w-6 h-6" />}
        actions={
          <div className="flex gap-2">
            <button onClick={() => refreshStatuses(regions)} disabled={refreshing} className="btn-ghost">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Region
            </button>
          </div>
        }
      />

      {error && (
        <div className="card p-4 border-red-500/30 bg-red-500/5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs text-red-400 hover:text-red-300">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Total Regions</span>
            <MapPin className="w-4 h-4 text-aqua-400" />
          </div>
          <div className="font-display text-3xl font-bold text-white">{regions.length}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Severe / High</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="font-display text-3xl font-bold text-red-400">{highRisk}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Moderate</span>
            <Activity className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="font-display text-3xl font-bold text-yellow-400">{moderateRisk}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Low</span>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <div className="font-display text-3xl font-bold text-green-400">{lowRisk}</div>
        </div>
      </div>

      {showAdd && (
        <div className="card p-6 animate-slide-up">
          <h3 className="font-display font-semibold text-white mb-4">Add New Region</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Name</label>
              <input value={newRegion.name} onChange={(e) => setNewRegion({ ...newRegion, name: e.target.value })} className="input" placeholder="e.g. Darbhanga" />
            </div>
            <div>
              <label className="label">State</label>
              <input value={newRegion.state} onChange={(e) => setNewRegion({ ...newRegion, state: e.target.value })} className="input" placeholder="e.g. Bihar" />
            </div>
            <div>
              <label className="label">Population</label>
              <input value={newRegion.population} onChange={(e) => setNewRegion({ ...newRegion, population: e.target.value })} className="input" placeholder="e.g. 500000" type="number" />
            </div>
            <div>
              <label className="label">Baseline Risk</label>
              <select value={newRegion.risk_level} onChange={(e) => setNewRegion({ ...newRegion, risk_level: e.target.value })} className="input">
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="btn-primary">Add Region</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-semibold text-white">Watchlist</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live assessment using default readings: {DEFAULT_READINGS.annual_rainfall}mm rainfall, {DEFAULT_READINGS.monsoon_intensity} monsoon, {DEFAULT_READINGS.river_water_level}m river level
            </p>
          </div>
        </div>

        {statuses.length === 0 ? (
          <div className="text-center py-12">
            <Radar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No regions on the watchlist yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {statuses
              .slice()
              .sort((a, b) => b.liveProbability - a.liveProbability)
              .map((s) => {
                const risk = classifyRisk(s.liveProbability);
                return (
                  <div
                    key={s.region.id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-ink-800/40 hover:bg-ink-800/70 transition-colors border border-white/5"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${risk.color}15`, color: risk.color }}
                      >
                        <CloudRain className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">{s.region.name}</span>
                          <span className="text-xs text-slate-500">{s.region.state}</span>
                          <RiskBadge probability={s.liveProbability} size="sm" />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          {s.region.population && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {s.region.population.toLocaleString()}
                            </span>
                          )}
                          <span>Baseline: {s.region.risk_level}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-display font-bold text-white tabular-nums">
                          {(s.liveProbability * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-500">Flood probability</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAssess(s.region)} className="btn-ghost text-xs">
                          <Activity className="w-3.5 h-3.5" />
                          Assess
                        </button>
                        <button onClick={() => handleDelete(s.region.id)} className="btn-danger text-xs" title="Remove region">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
