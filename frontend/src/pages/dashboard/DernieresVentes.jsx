import { useDernieresVentes } from '../../hooks/useDashboard';
import {
  formatMontant,
  formatDateTime,
  getStatutBadge,
  getStatutLabel
} from '../../utils/format';

import useAuthStore from '../../store/authStore';
import { Receipt } from 'lucide-react';

export default function DernieresVentes() {

  const { magasinActif } = useAuthStore();
  const { data, isLoading } = useDernieresVentes(magasinActif?._id);
  const ventes = data?.data || [];

  return (
    <div className="card">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">

        <div>
          <h3 className="dv-title">Dernières ventes</h3>
          <p className="dv-subtitle">Factures récentes</p>
        </div>

        <Receipt className="w-5 h-5 text-gray-400 dark:text-gray-500" />

      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="dv-skeleton">

              <div className="space-y-1.5">
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" />
              </div>

              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />

            </div>
          ))}
        </div>
      ) : ventes.length === 0 ? (

        /* Empty */
        <div className="dv-empty">
          Aucune vente récente
        </div>

      ) : (

        /* List */
        <div className="space-y-2">

          {ventes.map((f) => (
            <div key={f._id} className="dv-item">

              {/* Left */}
              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <span className="dv-number">
                    {f.numero}
                  </span>

                  <span>
                    {getStatutBadge(f.statut)}
                  </span>

                </div>

                <p className="dv-client mt-0.5">
                  {f.client?.nom} {f.client?.prenom}
                </p>

                <p className="dv-meta">
                  {f.magasin?.nom} — {formatDateTime(f.createdAt)}
                </p>

              </div>

              {/* Right */}
              <div className="text-right shrink-0 ml-3">

                <p className="dv-price">
                  {formatMontant(f.totalTTC)}
                </p>

                {f.montantRestant > 0 && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    Reste: {formatMontant(f.montantRestant)}
                  </p>
                )}

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}