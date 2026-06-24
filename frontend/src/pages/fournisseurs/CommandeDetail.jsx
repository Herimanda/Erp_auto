import { useCommande } from '../../hooks/useFournisseurs';
import {
  formatMontant, formatDate, getStatutBadge, getStatutLabel
} from '../../utils/format';

export default function CommandeDetail({ commandeId }) {
  const { data, isLoading } = useCommande(commandeId);
  const commande = data?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary-600
                        border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }
  if (!commande) return null;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xl font-bold font-mono text-primary-600">
            {commande.numero}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {commande.fournisseur?.raisonSociale} —{' '}
            {commande.magasin?.nom}
          </p>
          <p className="text-xs text-gray-400">
            Créée le {formatDate(commande.createdAt)} par{' '}
            {commande.creePar?.prenom} {commande.creePar?.nom}
          </p>
        </div>
        <span className={getStatutBadge(commande.statut)}>
          {getStatutLabel(commande.statut)}
        </span>
      </div>

      {/* Lignes */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">Article</th>
              <th className="table-header text-center">Commandé</th>
              <th className="table-header text-center">Reçu</th>
              <th className="table-header text-right">Prix unit.</th>
              <th className="table-header text-right">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {commande.lignes?.map((l, i) => (
              <tr key={i} className="border-b border-gray-100
                                     last:border-0">
                <td className="table-cell">
                  <p className="font-medium">
                    {l.article?.designation || l.designation}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {l.article?.reference}
                  </p>
                </td>
                <td className="table-cell text-center font-medium">
                  {l.quantiteCommandee}
                </td>
                <td className="table-cell text-center">
                  <span className={
                    l.quantiteRecue >= l.quantiteCommandee
                      ? 'text-green-600 font-medium'
                      : l.quantiteRecue > 0
                        ? 'text-yellow-600 font-medium'
                        : 'text-gray-400'
                  }>
                    {l.quantiteRecue || 0}
                  </span>
                </td>
                <td className="table-cell text-right">
                  {formatMontant(l.prixUnitaire)}
                </td>
                <td className="table-cell text-right font-medium">
                  {formatMontant(l.montantHT)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colSpan={4}
                className="table-cell text-right font-semibold">
                Total HT
              </td>
              <td className="table-cell text-right font-bold text-lg">
                {formatMontant(commande.totalHT)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Dates */}
      {(commande.dateLivraisonPrevue || commande.dateLivraisonReelle) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Livraison prévue</p>
            <p className="font-medium text-sm mt-1">
              {commande.dateLivraisonPrevue
                ? formatDate(commande.dateLivraisonPrevue) : '—'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Livraison réelle</p>
            <p className="font-medium text-sm mt-1">
              {commande.dateLivraisonReelle
                ? formatDate(commande.dateLivraisonReelle) : '—'}
            </p>
          </div>
        </div>
      )}

      {commande.notes && (
        <div className="bg-yellow-50 border border-yellow-200
                        rounded-xl p-3">
          <p className="text-xs font-medium text-yellow-700 mb-1">
            Notes
          </p>
          <p className="text-sm text-yellow-800">{commande.notes}</p>
        </div>
      )}
    </div>
  );
}