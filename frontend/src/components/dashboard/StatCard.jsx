import React from 'react';

/**
 * Reusable Stat Card for Analytics Dashboards
 * @param {string} title - Card Label (e.g., "Overall Attendance")
 * @param {string|number} value - Main displayed value (e.g., "88%")
 * @param {React.ReactNode} icon - Lucide-react Icon component
 * @param {string} subtitle - Optional description below value
 * @param {string} badgeText - Optional status pill (e.g., "Good", "Low Warning")
 * @param {'emerald'|'rose'|'amber'|'sky'} colorScheme - Theme accent color
 */
export default function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  badgeText,
  colorScheme = 'sky',
}) {
  const colorMap = {
    sky: {
      iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
  };

  const currentTheme = colorMap[colorScheme] || colorMap.sky;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700/80 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${currentTheme.iconBg}`}>
            <Icon className="w-5 h-5 shrink-0" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {value}
          </span>
          {badgeText && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentTheme.badge}`}
            >
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}