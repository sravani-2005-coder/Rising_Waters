import { useEffect, useState } from 'react';
import {
  History as HistoryIcon,
  Trash2,
  RefreshCw,
  Search,
  CloudRain,
  MapPin,
  Filter,
  Inbox,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { RiskBadge } from '../components/RiskBadge';
import { fetchPredictions, deletePrediction } from '../lib/predictionService';
import { classifyRisk, type PredictionRecord } from '../lib/types';

interface HistoryProps {
  refreshKey: number;
}

export function History({ refreshKey }: HistoryProps) {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selected, setSelected] = useState<PredictionRecord | null>(null);

  useEffect(() => {
    void load();
  }, [refreshKey]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPredictions(200);
      setPredictions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePrediction(id);
      setPredictions((prev) => prev.filter((p) => p.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const filtered = predictions.filter((p) => {
    if (riskFilter !== 'all' && p.risk_level !== riskFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.region_name?.toLowerCase().includes(q) ?? false) ||
        p.model_used.toLowerCase().includes(q) ||
        (p.notes?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prediction History"
        subtitle="Every forecast run through the system is logged here. Search, filter, and review past predictions for audits and trend analysis."
        icon={<HistoryIcon className="w-6 h-6" />}
        actions={
          <button onClick={load} className="btn-ghost">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="card p-4 border-red-500/30 bg-red-500/5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by region, model, or notes..."
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="input min-w-[140px]">
              <option value="all">All risk levels</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="severe">Severe</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-ink-800/50 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-ink-800 flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">
                {predictions.length === 0 ? 'No predictions logged yet.' : 'No predictions match your filters.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[640px] overflow-y-auto">
              {filtered.map((p) => {
                const risk = classifyRisk(p.flood_probability);
                const isSelected = selected?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-aqua-500/10' : 'hover:bg-ink-800/50'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${risk.color}15`, color: risk.color }}
                    >
                      <CloudRain className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm truncate">
                          {p.region_name ?? 'Unassigned'}
                        </span>
                        <RiskBadge probability={p.flood_probability} size="sm" />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.model_used} · {new Date(p.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-display font-bold text-white tabular-nums">
                        {(p.flood_probability * 100).toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(p.id);
                      }}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-6 h-fit sticky top-6">
          <h3 className="font-display font-semibold text-white mb-4">Prediction Detail</h3>
          {selected ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Region</div>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-aqua-400" />
                  <span className="text-white font-medium">{selected.region_name ?? 'Unassigned'}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Risk Level</div>
                <div className="mt-1.5">
                  <RiskBadge probability={selected.flood_probability} size="lg" />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {classifyRisk(selected.flood_probability).description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                  <div className="text-xs text-slate-500">Probability</div>
                  <div className="text-lg font-display font-bold text-white tabular-nums">
                    {(selected.flood_probability * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                  <div className="text-xs text-slate-500">Model</div>
                  <div className="text-sm font-medium text-white mt-1">{selected.model_used}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Weather Inputs</div>
                <div className="space-y-1.5 text-sm">
                  <Row label="Annual Rainfall" value={`${selected.annual_rainfall} mm`} />
                  <Row label="Monsoon Intensity" value={selected.monsoon_intensity.toString()} />
                  <Row label="River Water Level" value={`${selected.river_water_level} m`} />
                  <Row label="Soil Moisture" value={`${selected.soil_moisture}%`} />
                  <Row label="Cloud Visibility" value={`${selected.cloud_visibility} km`} />
                  <Row label="Temperature" value={`${selected.temperature} °C`} />
                  <Row label="Humidity" value={`${selected.humidity}%`} />
                </div>
              </div>
              {selected.notes && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Notes</div>
                  <p className="text-sm text-slate-300 p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    {selected.notes}
                  </p>
                </div>
              )}
              <div className="text-xs text-slate-500 pt-2 border-t border-white/5">
                {new Date(selected.created_at).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <HistoryIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Select a prediction to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-mono tabular-nums">{value}</span>
    </div>
  );
}
