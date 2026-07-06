import { type ReactNode } from 'react';
import {
  LayoutDashboard,
  CloudLightning,
  Cpu,
  Radar,
  History,
  BarChart3,
  Waves,
  AlertTriangle,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'predict'
  | 'models'
  | 'monitor'
  | 'history'
  | 'analytics';

interface LayoutProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  children: ReactNode;
  bestModelName: string | null;
  bestAccuracy: number | null;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & live risk' },
  { id: 'predict', label: 'Predict', icon: CloudLightning, description: 'Run a flood prediction' },
  { id: 'monitor', label: 'Monitor', icon: Radar, description: 'Multi-region watch' },
  { id: 'models', label: 'Models', icon: Cpu, description: 'ML model performance' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Dataset insights' },
  { id: 'history', label: 'History', icon: History, description: 'Past predictions' },
];

export function Layout({ current, onNavigate, children, bestModelName, bestAccuracy }: LayoutProps) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-72 shrink-0 border-r border-white/5 bg-ink-950/80 backdrop-blur-xl flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aqua-500 to-storm-600 flex items-center justify-center shadow-lg shadow-aqua-500/30">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse-ring" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-tight">AquaGuard</h1>
              <p className="text-xs text-slate-500">Flood Prediction AI</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`nav-item w-full text-left ${active ? 'nav-item-active' : ''}`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-aqua-400' : ''}`} size={18} />
                <div className="flex-1">
                  <div>{item.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="card p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">Active Model</span>
            </div>
            {bestModelName ? (
              <>
                <div className="font-display font-semibold text-white text-sm">{bestModelName}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Accuracy: <span className="text-aqua-400 font-mono">{bestAccuracy != null ? `${(bestAccuracy * 100).toFixed(2)}%` : '—'}</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500">Training in progress...</div>
            )}
          </div>
          <div className="mt-3 px-2 flex items-center gap-2 text-[10px] text-slate-600">
            <AlertTriangle className="w-3 h-3" />
            <span>For decision support only. Not a substitute for official warnings.</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">{children}</div>
      </main>
    </div>
  );
}
