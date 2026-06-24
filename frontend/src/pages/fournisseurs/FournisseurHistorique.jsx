import { useHistoriqueFournisseur } from '../../hooks/useFournisseurs';
import {
  formatMontant, formatDate,
  getStatutBadge, getStatutLabel
} from '../../utils/format';
import { ShoppingCart } from 'lucide-react';

export default function FournisseurHistorique({ fournisseurId }) {
  const { data, isLoading } = useHistoriqueFournisseur(fournisseurId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary-600
                        border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { fournisseur, stats, commandes } = data?.data || {};

  return (
    <div className="space-y-6">
      {/* Infos */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <p className="font-semibold text-gray-900 text-lg">
          {fournisseur?.raisonSociale}
        </p>
        <p className="text-sm text-gray-500">
          {fournisseur?.reference} — {fournisseur?.contact}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Total commandes',
            value: stats?.totalCommandes || 0
          },
          {
            label: 'Total achats',
            value: formatMontant(stats?.totalAchats)
          },
          {
            label: 'En cours',
            value: stats?.commandesEnCours || 0
          }
        ].map((kpi) => (
          <div key={kpi.label}
            className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Commandes */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3
                       flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" /> Commandes
        </h4>
        {commandes?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucune commande
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {commandes?.map((c) => (
              <div key={c._id}
                className="flex items-center justify-between
                           p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-mono font-medium text-sm
                                text-primary-600">
                    {c.numero}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(c.createdAt)} — {c.magasin?.nom}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.lignes?.length} article(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatMontant(c.totalHT)}
                  </p>
                  <span className={getStatutBadge(c.statut)}>
                    {getStatutLabel(c.statut)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}