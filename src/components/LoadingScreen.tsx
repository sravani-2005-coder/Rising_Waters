import { Waves } from 'lucide-react';

export function LoadingScreen({ message = 'Training models...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-aqua-500 to-storm-600 flex items-center justify-center shadow-2xl shadow-aqua-500/30 animate-pulse">
            <Waves className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-2xl border-2 border-aqua-500/30 animate-pulse-ring" />
        </div>
        <h2 className="font-display text-xl font-semibold text-white mb-2">AquaGuard</h2>
        <p className="text-slate-400 text-sm">{message}</p>
        <div className="mt-6 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-aqua-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
