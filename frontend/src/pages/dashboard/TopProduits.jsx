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
    magasinActif?._id, periode
  );
  const produits = data?.data || [];
  const maxQte   = produits[0]?.quantiteTotal || 1;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Top produits
          </h3>
          <p className="text-sm text-gray-500">Par quantité vendue</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODES.map((p) => (
            <button key={p.v}
              onClick={() => setPeriode(p.v)}
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-medium',
                'transition-colors',
                periode === p.v
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"/>
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-3/4"/>
                <div className="h-2 bg-gray-100 rounded animate-pulse"/>
              </div>
            </div>
          ))}
        </div>
      ) : produits.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Aucune vente sur cette période</p>
        </div>
      ) : (
        <div className="space-y-3">
          {produits.slice(0, 8).map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center',
                'text-xs font-bold shrink-0',
                i === 0 ? 'bg-yellow-400 text-white'
                : i === 1 ? 'bg-gray-300 text-white'
                : i === 2 ? 'bg-orange-400 text-white'
                : 'bg-gray-100 text-gray-500'
              )}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.designation || p.article?.designation}
                  </p>
                  <span className="text-xs font-bold text-gray-700
                                   shrink-0 ml-2">
                    {p.quantiteTotal} unités
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full
                               transition-all duration-500"
                    style={{
                      width: `${(p.quantiteTotal / maxQte) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
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