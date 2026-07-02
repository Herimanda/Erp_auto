import { useState } from 'react';
import { useTopProduits } from '../../hooks/useDashboard';
import { formatMontant } from '../../utils/format';
import useAuthStore from '../../store/authStore';
import { clsx } from 'clsx';
import { Package } from 'lucide-react';

const PERIODES = [
  { v: 'jour',    l: 'Auj.' },
  { v: 'semaine', l: 'Sem.' },
  { v: 'mois',    l: 'Mois' },
  { v: 'annee',   l: 'An' },
];

export default function TopProduits() {
  const { magasinActif } = useAuthStore();
  const [periode, setPeriode] = useState('mois');

  const { data, isLoading } = useTopProduits(
    magasinActif?._id,
    periode
  );

  const produits = data?.data || [];
  const maxQte = produits[0]?.quantiteTotal || 1;

  const badgeColor = (i) => {
    if (i === 0) return "bg-yellow-400 text-white dark:bg-yellow-500";
    if (i === 1) return "bg-gray-300 text-white dark:bg-gray-500";
    if (i === 2) return "bg-orange-400 text-white dark:bg-orange-500";
    return "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <div className="card">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">

        <div>
          <h3 className="tp-title">Top produits</h3>
          <p className="tp-subtitle">Par quantité vendue</p>
        </div>

        <div className="tp-period-bar">
          {PERIODES.map((p) => (
            <button
              key={p.v}
              onClick={() => setPeriode(p.v)}
              className={clsx(
                "tp-period-btn",
                periode === p.v
                  ? "bg-white text-gray-900 dark:bg-gray-700 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              {p.l}
            </button>
          ))}
        </div>

      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : produits.length === 0 ? (

        /* Empty */
        <div className="tp-empty">
          <Package className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">Aucune vente sur cette période</p>
        </div>

      ) : (

        /* List */
        <div className="space-y-3">

          {produits.slice(0, 8).map((p, i) => (
            <div key={i} className="flex items-center gap-3">

              {/* Rank */}
              <span className={clsx("tp-badge", badgeColor(i))}>
                {i + 1}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">

                <div className="flex items-center justify-between mb-1">

                  <p className="tp-item-title">
                    {p.designation || p.article?.designation}
                  </p>

                  <span className="tp-item-value">
                    {p.quantiteTotal} unités
                  </span>

                </div>

                {/* Progress */}
                <div className="tp-bar-bg">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${(p.quantiteTotal / maxQte) * 100}%`
                    }}
                  />
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatMontant(p.caTotal)}
                </p>

              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}