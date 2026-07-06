import { useState } from 'react';
import {
  CloudLightning,
  CloudRain,
  Droplets,
  Thermometer,
  Wind,
  Waves,
  Gauge,
  Save,
  RotateCcw,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { RiskGauge } from '../components/RiskGauge';
import { RiskBadge } from '../components/RiskBadge';
import { useModel } from '../lib/modelContext';
import { runPrediction, type PredictionOutput } from '../lib/predictionService';
import { type Region } from '../lib/types';
import { BarChart } from '../components/BarChart';

interface PredictProps {
  regions: Region[];
  onPredicted: () => void;
}

interface FieldConfig {
  key: keyof WeatherForm;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  icon: typeof CloudRain;
  description: string;
}

interface WeatherForm {
  annual_rainfall: number;
  monsoon_intensity: number;
  river_water_level: number;
  soil_moisture: number;
  cloud_visibility: number;
  temperature: number;
  humidity: number;
}

const FIELDS: FieldConfig[] = [
  { key: 'annual_rainfall', label: 'Annual Rainfall', unit: 'mm', min: 200, max: 3500, step: 10, default: 1450, icon: CloudRain, description: 'Total yearly precipitation' },
  { key: 'monsoon_intensity', label: 'Monsoon Intensity', unit: 'index', min: 0, max: 100, step: 1, default: 55, icon: Waves, description: 'Seasonal rainfall strength' },
  { key: 'river_water_level', label: 'River Water Level', unit: 'm', min: 0, max: 15, step: 0.1, default: 6.5, icon: Droplets, description: 'Current river gauge height' },
  { key: 'soil_moisture', label: 'Soil Moisture', unit: '%', min: 0, max: 100, step: 1, default: 60, icon: Gauge, description: 'Ground saturation' },
  { key: 'cloud_visibility', label: 'Cloud Visibility', unit: 'km', min: 0, max: 10, step: 0.1, default: 5.0, icon: Wind, description: 'Lower = denser cloud cover' },
  { key: 'temperature', label: 'Temperature', unit: '°C', min: 10, max: 45, step: 0.5, default: 28, icon: Thermometer, description: 'Average ambient temperature' },
  { key: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, step: 1, default: 72, icon: Droplets, description: 'Relative humidity' },
];

export function Predict({ regions, onPredicted }: PredictProps) {
  const { training, loading } = useModel();
  const [form, setForm] = useState<WeatherForm>({
    annual_rainfall: 1450,
    monsoon_intensity: 55,
    river_water_level: 6.5,
    soil_moisture: 60,
    cloud_visibility: 5.0,
    temperature: 28,
    humidity: 72,
  });
  const [regionId, setRegionId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [modelName, setModelName] = useState<string>('');
  const [result, setResult] = useState<PredictionOutput | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRegion = regions.find((r) => r.id === regionId);
  const activeModelName = modelName || (training?.bestModel.name ?? '');

  const handleField = (key: keyof WeatherForm, value: number) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const reset = () => {
    setForm({
      annual_rainfall: 1450,
      monsoon_intensity: 55,
      river_water_level: 6.5,
      soil_moisture: 60,
      cloud_visibility: 5.0,
      temperature: 28,
      humidity: 72,
    });
    setRegionId('');
    setNotes('');
    setResult(null);
    setError(null);
  };

  const runForecast = async () => {
    if (!training) return;
    setRunning(true);
    setError(null);
    try {
      const output = await runPrediction(
        {
          ...form,
          regionId: regionId || null,
          regionName: selectedRegion?.name ?? null,
          notes: notes || null,
          modelName: activeModelName,
        },
        training,
      );
      setResult(output);
      onPredicted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Prediction failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading || !training) {
    return (
      <div>
        <PageHeader title="Predict" subtitle="Loading models..." icon={<CloudLightning className="w-6 h-6" />} />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  const featureContribution = training.bestModel.model.featureImportance
    ? training.bestModel.model.featureImportance().map((imp, i) => ({
        label: FIELDS[i].label,
        value: imp,
      }))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flood Prediction"
        subtitle="Enter current meteorological readings to forecast flood probability. The active model analyses seven weather features and returns a risk classification."
        icon={<CloudLightning className="w-6 h-6" />}
        actions={
          <button onClick={reset} className="btn-ghost">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-white">Weather Inputs</h3>
              <span className="text-xs text-slate-500">7 features</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FIELDS.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key}>
                    <label className="label">{field.label}</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-ink-800 border border-white/10 flex items-center justify-center text-aqua-400 shrink-0">
                        <Icon className="w-4.5 h-4.5" size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={form[field.key]}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            onChange={(e) => handleField(field.key, parseFloat(e.target.value) || 0)}
                            className="input flex-1"
                          />
                          <span className="text-xs text-slate-500 w-10 tabular-nums">{field.unit}</span>
                        </div>
                        <input
                          type="range"
                          value={form[field.key]}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          onChange={(e) => handleField(field.key, parseFloat(e.target.value))}
                          className="w-full mt-2 accent-aqua-500"
                        />
                        <p className="text-[10px] text-slate-600 mt-1">{field.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-display font-semibold text-white mb-4">Context</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Region (optional)</label>
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="input"
                >
                  <option value="">Unassigned</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.state}
                    </option>
                  ))}
                </select>
                {selectedRegion && (
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Baseline risk: <span className="text-slate-300">{selectedRegion.risk_level}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="label">Model</label>
                <select
                  value={activeModelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="input"
                >
                  {training.models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({(m.metrics.accuracy * 100).toFixed(1)}%)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1.5">
                  Default: best-performing model
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="label">Operator notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cyclone alert issued, monsoon onset observed..."
                  className="input min-h-[80px] resize-y"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="card p-4 border-red-500/30 bg-red-500/5 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={runForecast} disabled={running} className="btn-primary flex-1">
              {running ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Run & Save Prediction
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-display font-semibold text-white mb-4">Prediction Result</h3>
            {result ? (
              <div className="space-y-5 animate-fade-in">
                <div className="flex justify-center">
                  <RiskGauge probability={result.probability} size={200} />
                </div>
                <div className="text-center">
                  <RiskBadge probability={result.probability} size="lg" />
                </div>
                <div className={`p-4 rounded-xl border ${result.risk.bg} ${result.risk.border}`}>
                  <div className="flex items-start gap-2">
                    {result.label === 1 ? (
                      <AlertTriangle className={`w-5 h-5 ${result.risk.text} shrink-0 mt-0.5`} />
                    ) : (
                      <CheckCircle2 className={`w-5 h-5 ${result.risk.text} shrink-0 mt-0.5`} />
                    )}
                    <div>
                      <div className={`font-medium ${result.risk.text}`}>
                        {result.label === 1 ? 'Flood predicted' : 'No flood predicted'}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{result.risk.description}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    <div className="text-xs text-slate-500">Model</div>
                    <div className="text-sm font-medium text-white mt-0.5">{result.modelUsed}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    <div className="text-xs text-slate-500">Confidence</div>
                    <div className="text-sm font-medium text-white mt-0.5 tabular-nums">
                      {(result.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                {selectedRegion && (
                  <div className="p-3 rounded-xl bg-ink-800/50 border border-white/5">
                    <div className="text-xs text-slate-500">Region</div>
                    <div className="text-sm font-medium text-white mt-0.5">
                      {selectedRegion.name}, {selectedRegion.state}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-ink-800 flex items-center justify-center mb-4">
                  <CloudLightning className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm">No prediction yet</p>
                <p className="text-xs text-slate-600 mt-1 max-w-xs">
                  Adjust the weather inputs and run a forecast to see the result here.
                </p>
              </div>
            )}
          </div>

          {featureContribution.length > 0 && (
            <div className="card p-6">
              <h3 className="font-display font-semibold text-white mb-1">Feature Importance</h3>
              <p className="text-xs text-slate-500 mb-4">How much each feature influences the model</p>
              <BarChart
                data={featureContribution.map((f) => ({
                  label: f.label,
                  value: f.value,
                }))}
                horizontal
                valueFormat={(v) => `${(v * 100).toFixed(1)}%`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
