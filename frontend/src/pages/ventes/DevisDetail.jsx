import { useUnDevis } from '../../hooks/useVentes';
import LignesDocument from '../../components/ventes/LignesDocument';
import { formatMontant, formatDate, getStatutBadge, getStatutLabel }
  from '../../utils/format';

export default function DevisDetail({ devisId }) {
  const { data, isLoading } = useUnDevis(devisId);
  const devis = data?.data;

  if (isLoading) return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-4 border-primary-600
                      border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  if (!devis) return null;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between
                      p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="text-xl font-bold font-mono text-primary-600">
            {devis.numero}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {devis.client?.nom} {devis.client?.prenom}
            {devis.client?.societe && ` — ${devis.client.societe}`}
          </p>
          <p className="text-xs text-gray-400">
            {devis.magasin?.nom} — {formatDate(devis.createdAt)}
          </p>
        </div>
        <span className={getStatutBadge(devis.statut)}>
          {getStatutLabel(devis.statut)}
        </span>
      </div>

      {/* Lignes */}
      <LignesDocument
        lignes={devis.lignes}
        onChange={() => {}}
        readOnly
      />

      {/* Totaux */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Total HT</span>
          <span>{formatMontant(devis.totalHT)}</span>
        </div>
        {devis.remiseGlobale > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Remise ({devis.remiseGlobale}%)</span>
            <span>— {formatMontant(
              devis.totalHT * devis.remiseGlobale / 100
            )}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-500">
          <span>TVA</span>
          <span>{formatMontant(devis.totalTVA)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg
                        text-gray-900 pt-2 border-t border-gray-200">
          <span>Total TTC</span>
          <span className="text-primary-600">
            {formatMontant(devis.totalTTC)}
          </span>
        </div>
      </div>

      {devis.notes && (
        <div className="bg-yellow-50 border border-yellow-200
                        rounded-xl p-3">
          <p className="text-xs font-medium text-yellow-700 mb-1">Notes</p>
          <p className="text-sm text-yellow-800">{devis.notes}</p>
        </div>
      )}
    </div>
  );
}