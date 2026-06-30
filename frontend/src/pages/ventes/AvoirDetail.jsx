import { useAvoir } from '../../hooks/useVentes';
import LignesDocument from '../../components/ventes/LignesDocument';
import {
  formatMontant, formatDate, formatDateTime,
  getStatutBadge, getStatutLabel
} from '../../utils/format';
import { FileMinus } from 'lucide-react';

const TYPE_LABEL = {
  retour_produit:       'Retour produit',
  annulation_partielle: 'Annulation partielle',
  annulation_totale:    'Annulation totale'
};

export default function AvoirDetail({ avoirId }) {
  const { data, isLoading } = useAvoir(avoirId);
  const avoir = data?.data;

  if (isLoading) return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-4 border-primary-600
                      border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  if (!avoir) return null;

  const montantConsomme = avoir.totalTTC - (avoir.soldeRestant ?? avoir.totalTTC);

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between
                      p-4 bg-orange-50 rounded-xl">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-xl font-bold font-mono text-orange-600">
              {avoir.numero}
            </p>
            <span className={getStatutBadge(avoir.statut)}>
              {getStatutLabel(avoir.statut)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {avoir.client?.nom} {avoir.client?.prenom}
            {avoir.client?.societe && ` — ${avoir.client.societe}`}
          </p>
          <p className="text-xs text-gray-400">
            Facture origine :{' '}
            <span className="font-mono text-primary-600">
              {avoir.factureOrigine?.numero}
            </span>
            {' — '}{avoir.magasin?.nom} — {formatDate(avoir.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Type</p>
          <p className="font-medium text-sm">
            {TYPE_LABEL[avoir.type] || avoir.type}
          </p>
        </div>
      </div>

      {/* Lignes */}
      {avoir.lignes?.length > 0 ? (
        <LignesDocument
          lignes={avoir.lignes}
          onChange={() => {}}
          readOnly
        />
      ) : (
        <div className="text-center py-8 text-gray-400">
          <FileMinus className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Aucune ligne sur cet avoir</p>
        </div>
      )}

      {/* Récapitulatif */}
      <div className="bg-orange-50 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-orange-800 mb-2">
          Récapitulatif
        </p>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Total HT</span>
          <span>— {formatMontant(avoir.totalHT)}</span>
        </div>
        <div className="flex justify-between font-bold text-orange-900
                        pt-2 border-t border-orange-200">
          <span>Total avoir TTC</span>
          <span>— {formatMontant(avoir.totalTTC)}</span>
        </div>

        {avoir.statut === 'en_attente' && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mt-2">
            Cet avoir est en attente de validation. Le stock et le crédit
            client ne seront mis à jour qu'après validation.
          </p>
        )}

        {['valide', 'consomme'].includes(avoir.statut) && (
          <>
            <div className="flex justify-between text-sm text-gray-500 pt-2">
              <span>Crédit utilisé</span>
              <span>{formatMontant(montantConsomme)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold
                            text-green-600">
              <span>Crédit restant</span>
              <span>{formatMontant(avoir.soldeRestant)}</span>
            </div>
          </>
        )}

        {avoir.statut === 'annule' && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mt-2">
            Cet avoir a été annulé. Aucun crédit n'est disponible.
          </p>
        )}
      </div>

      {/* Métadonnées */}
      <div className="text-xs text-gray-400 flex justify-between">
        <span>Créé par {avoir.creePar?.nom} {avoir.creePar?.prenom}</span>
        <span>{formatDateTime(avoir.createdAt)}</span>
      </div>
    </div>
  );
}