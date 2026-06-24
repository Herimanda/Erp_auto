import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KpiCard({
  title, value, subtitle, icon: Icon,
  color = 'blue', evolution, loading
}) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
  };
  const c = colors[color];

  return (
    <div className={clsx(
      'bg-white rounded-2xl p-5 border shadow-sm',
      'hover:shadow-md transition-shadow duration-200',
      c.border
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={clsx(
          'w-11 h-11 rounded-xl flex items-center justify-center',
          c.bg
        )}>
          <Icon className={clsx('w-5 h-5', c.icon)} />
        </div>
        {evolution !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            evolution >= 0
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          )}>
            {evolution >= 0
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />}
            {Math.abs(evolution)}%
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-7 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900 leading-tight">
            {value}
          </p>
          <p className="text-sm text-gray-500 mt-1">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
}