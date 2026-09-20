import React from 'react';
import { LucideIcon, Check } from 'lucide-react';

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
  tag: string;
  accentColor: string; // e.g. 'indigo', 'emerald', 'blue', 'purple', 'amber', 'rose'
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  points,
  tag,
  accentColor,
}) => {
  const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600',
      text: 'text-indigo-600',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      text: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      text: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600',
      text: 'text-purple-600',
      badge: 'bg-purple-50 text-purple-700 border-purple-200/60',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      text: 'text-amber-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      text: 'text-rose-600',
      badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
    },
  };

  const currentTheme = colorMap[accentColor] || colorMap.indigo;

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl ${currentTheme.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentTheme.badge}`}>
            {tag}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-2">
        {points.map((point, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
            <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-indigo-600" />
            </div>
            <span>{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

