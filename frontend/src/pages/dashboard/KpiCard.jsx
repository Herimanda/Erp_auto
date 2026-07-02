import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KpiCard({
  title, value, subtitle, icon: Icon,
  color = 'blue', evolution, loading
}) {

  const colors = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-300' },
    green:  { bg: 'bg-green-50 dark:bg-green-900/30', icon: 'text-green-600 dark:text-green-300' },
    red:    { bg: 'bg-red-50 dark:bg-red-900/30', icon: 'text-red-600 dark:text-red-300' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', icon: 'text-yellow-600 dark:text-yellow-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-300' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', icon: 'text-orange-600 dark:text-orange-300' },
  };

  const c = colors[color];

  return (
    <div className="kpi-card">

      {/* header */}
      <div className="flex items-start justify-between mb-3">

        <div className={clsx("kpi-icon", c.bg)}>
          <Icon className={clsx("w-5 h-5", c.icon)} />
        </div>

        {evolution !== undefined && (
          <div className={clsx(
            "kpi-evolution",
            evolution >= 0
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          )}>
            {evolution >= 0
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {Math.abs(evolution)}%
          </div>
        )}
      </div>

      {/* body */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-1/2" />
        </div>
      ) : (
        <>
          <p className="kpi-value">{value}</p>
          <p className="kpi-title">{title}</p>

          {subtitle && (
            <p className="kpi-subtitle">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
}