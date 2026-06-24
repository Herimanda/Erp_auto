import { useHistoriqueClient } from '../../hooks/useClients';
import {
  formatMontant, formatDate,
  getStatutBadge, getStatutLabel
} from '../../utils/format';
import { Receipt, TrendingUp, AlertCircle } from 'lucide-react';

export default function ClientHistorique({ clientId }) {
  const { data, isLoading } = useHistoriqueClient(clientId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary-600
                        border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { client, stats, factures, avoirs } = data?.data || {};

  return (
    <div className="space-y-6">
      {/* Infos client */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-primary-100
                        flex items-center justify-center">
          <span className="text-lg font-bold text-primary-600">
            {client?.nom?.[0]}
          </span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            {client?.nom} {client?.prenom}
          </p>
          {client?.societe && (
            <p className="text-sm text-gray-500">{client.societe}</p>
          )}
          <p className="text-xs text-gray-400">{client?.numeroClient}</p>
        </div>
        {client?.solde > 0 && (
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">Solde dû</p>
            <p className="text-lg font-bold text-red-600">
              {formatMontant(client.solde)}
            </p>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total achats',
            value: formatMontant(stats?.totalAchats),
            color: 'text-primary-600'
          },
          {
            label: 'Total payé',
            value: formatMontant(stats?.totalPaye),
            color: 'text-green-600'
          },
          {
            label: 'Restant dû',
            value: formatMontant(stats?.totalRestant),
            color: 'text-red-600'
          },
          {
            label: 'Nb factures',
            value: stats?.totalFactures || 0,
            color: 'text-gray-900'
          }
        ].map((kpi) => (
          <div key={kpi.label}
            className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className={`text-lg font-bold mt-1 ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Factures */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3
                       flex items-center gap-2">
          <Receipt className="w-4 h-4" /> Factures
        </h4>
        {factures?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucune facture
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {factures?.map((f) => (
              <div key={f._id}
                className="flex items-center justify-between
                           p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-mono font-medium text-primary-600">
                    {f.numero}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(f.createdAt)} — {f.magasin?.nom}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatMontant(f.totalTTC)}
                  </p>
                  {f.montantRestant > 0 && (
                    <p className="text-xs text-red-500">
                      Reste: {formatMontant(f.montantRestant)}
                    </p>
                  )}
                </div>
                <span className={`ml-3 ${getStatutBadge(f.statut)}`}>
                  {getStatutLabel(f.statut)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avoirs */}
      {avoirs?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3
                         flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Avoirs
          </h4>
          <div className="space-y-2">
            {avoirs.map((a) => (
              <div key={a._id}
                className="flex items-center justify-between
                           p-3 bg-orange-50 rounded-lg text-sm">
                <div>
                  <p className="font-mono font-medium text-orange-600">
                    {a.numero}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(a.createdAt)}
                  </p>
                </div>
                <p className="font-semibold text-orange-600">
                  — {formatMontant(a.totalTTC)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}