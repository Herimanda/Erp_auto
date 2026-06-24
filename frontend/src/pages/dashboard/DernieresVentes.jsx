import { useDernieresVentes } from '../../hooks/useDashboard';
import { formatMontant, formatDateTime, getStatutBadge, getStatutLabel }
  from '../../utils/format';
import useAuthStore from '../../store/authStore';
import { Receipt } from 'lucide-react';

export default function DernieresVentes() {
  const { magasinActif } = useAuthStore();
  const { data, isLoading } = useDernieresVentes(magasinActif?._id);
  const ventes = data?.data || [];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Dernières ventes
          </h3>
          <p className="text-sm text-gray-500">
            Factures récentes
          </p>
        </div>
        <Receipt className="w-5 h-5 text-gray-400" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i}
              className="flex items-center justify-between p-3
                         bg-gray-50 rounded-lg">
              <div className="space-y-1.5">
                <div className="h-3.5 bg-gray-200 rounded
                                animate-pulse w-32"/>
                <div className="h-3 bg-gray-100 rounded
                                animate-pulse w-24"/>
              </div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-20"/>
            </div>
          ))}
        </div>
      ) : ventes.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Aucune vente récente
        </div>
      ) : (
        <div className="space-y-2">
          {ventes.map((f) => (
            <div key={f._id}
              className="flex items-center justify-between p-3
                         bg-gray-50 hover:bg-gray-100 rounded-xl
                         transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-primary-600
                                   font-semibold">
                    {f.numero}
                  </span>
                  <span className={getStatutBadge(f.statut)}>
                    {getStatutLabel(f.statut)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-medium mt-0.5">
                  {f.client?.nom} {f.client?.prenom}
                </p>
                <p className="text-xs text-gray-400">
                  {f.magasin?.nom} — {formatDateTime(f.createdAt)}
                </p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="font-bold text-gray-900 text-sm">
                  {formatMontant(f.totalTTC)}
                </p>
                {f.montantRestant > 0 && (
                  <p className="text-xs text-red-500">
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