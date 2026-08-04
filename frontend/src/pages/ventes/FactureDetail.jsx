import { useFacture } from '../../hooks/useVentes';
import LignesDocument from '../../components/ventes/LignesDocument';
import {
  formatMontant, formatDate, formatDateTime,
  getStatutBadge, getStatutLabel
} from '../../utils/format';
import { CreditCard, CheckCircle, Printer } from 'lucide-react';

const MODES_LABEL = {
  especes:  'Espèces',
  cheque:   'Chèque',
  virement: 'Virement',
  carte:    'Carte',
  avoir:    'Avoir'
};

// Ajouter en haut du composant
const API_BASE = import.meta.env.VITE_API_URL;




export default function FactureDetail({ factureId }) {
  const { data, isLoading } = useFacture(factureId);
  const facture = data?.data;

  const handlePrint = async () => {
  const token = localStorage.getItem('token');
  const res   = await fetch(
    `${API_BASE}/rapports/facture/${factureId}/pdf`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const blob  = await res.blob();
  const url   = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

  if (isLoading) return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-4 border-primary-600
                      border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  if (!facture) return null;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between
                      p-4 bg-gray-50 rounded-xl">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-xl font-bold font-mono text-primary-600">
              {facture.numero}
            </p>
            <span className={getStatutBadge(facture.statut)}>
              {getStatutLabel(facture.statut)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {facture.client?.nom} {facture.client?.prenom}
            {facture.client?.societe && ` — ${facture.client.societe}`}
          </p>
          <p className="text-xs text-gray-400">
            {facture.magasin?.nom} — {formatDate(facture.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Type</p>
          <p className="font-medium text-sm capitalize">{facture.type}</p>
        </div>
        <button
  onClick={handlePrint}
  className="btn-secondary flex items-center gap-2 text-sm"
>
  <Printer className="w-4 h-4" />
  Imprimer
</button>
      </div>

      {/* Lignes */}
      <LignesDocument
        lignes={facture.lignes}
        onChange={() => {}}
        readOnly
      />

      {/* Totaux & Paiements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Totaux */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Récapitulatif
          </p>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Total HT</span>
            <span>{formatMontant(facture.totalHT)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>TVA</span>
            <span>{formatMontant(facture.totalTVA)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900
                          pt-2 border-t border-gray-200">
            <span>Total TTC</span>
            <span className="text-primary-600">
              {formatMontant(facture.totalTTC)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-green-600
                          font-medium">
            <span>Payé</span>
            <span>{formatMontant(facture.montantPaye)}</span>
          </div>
          {facture.montantRestant > 0 && (
            <div className="flex justify-between text-sm text-red-600
                            font-bold">
              <span>Reste à payer</span>
              <span>{formatMontant(facture.montantRestant)}</span>
            </div>
          )}
        </div>

        {/* Historique paiements */}
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-800 mb-2
                        flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Paiements
          </p>
          {facture.paiements?.length === 0 ? (
            <p className="text-sm text-green-600 text-center py-4">
              Aucun paiement
            </p>
          ) : (
            <div className="space-y-2">
              {facture.paiements?.map((p, i) => (
                <div key={i}
                  className="flex items-center justify-between
                             bg-white rounded-lg p-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {MODES_LABEL[p.mode]}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(p.date)}
                    </p>
                  </div>
                  <p className="font-bold text-green-600">
                    {formatMontant(p.montant)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}