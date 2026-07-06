import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-slide-up">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aqua-500/20 to-storm-500/10 border border-aqua-500/20 flex items-center justify-center text-aqua-400">
            {icon}
          </div>
        )}
        <div>
          <h1 className="section-title">{title}</h1>
          {subtitle && (
            <p className="text-slate-400 mt-1.5 text-sm max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
