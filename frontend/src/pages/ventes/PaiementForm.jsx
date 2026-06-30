import { useState, useMemo } from 'react';
import { usePaiement, useAvoirsClient } from '../../hooks/useVentes';
import { formatMontant } from '../../utils/format';

const MODES = [
  { v: 'especes',  l: 'Espèces' },
  { v: 'cheque',   l: 'Chèque' },
  { v: 'virement', l: 'Virement' },
  { v: 'carte',    l: 'Carte bancaire' },
  { v: 'avoir',    l: 'Avoir' },
];

export default function PaiementForm({ facture, onSuccess }) {
  const [montant, setMontant]   = useState(facture?.montantRestant || '');
  const [mode, setMode]         = useState('especes');
  const [reference, setRef]     = useState('');
  const [avoirId, setAvoirId]   = useState('');
  const paiementMutation = usePaiement();

  // On ne va chercher les avoirs du client que si le mode "avoir" est actif
  const { data: avoirsData, isLoading: avoirsLoading } = useAvoirsClient(
    mode === 'avoir' ? facture?.client?._id : null
  );
  const avoirs = avoirsData?.data?.avoirs || [];
  const avoirSelectionne = avoirs.find((a) => a._id === avoirId);

  // Montant maximum autorisé : le plus petit entre le reste à payer
  // de la facture et le crédit restant sur l'avoir choisi.
  const maxMontant = useMemo(() => {
    if (mode === 'avoir') {
      if (!avoirSelectionne) return 0;
      return Math.min(
        facture?.montantRestant || 0,
        avoirSelectionne.soldeRestant || 0
      );
    }
    return facture?.montantRestant || 0;
  }, [mode, avoirSelectionne, facture]);

  const monnaie = Number(montant) - (facture?.montantRestant || 0);

  const handleModeChange = (m) => {
    setMode(m);
    setAvoirId('');
    // Recale le montant proposé sur le nouveau mode
    setMontant(facture?.montantRestant || '');
  };

  const handleAvoirChange = (id) => {
    setAvoirId(id);
    const av = avoirs.find((a) => a._id === id);
    if (av) {
      setMontant(Math.min(facture?.montantRestant || 0, av.soldeRestant));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(montant) <= 0) return;
    if (mode === 'avoir' && !avoirId) return;
    if (mode === 'avoir' && Number(montant) > maxMontant) return;

    await paiementMutation.mutateAsync({
      id: facture._id,
      data: {
        montant:   Number(montant),
        mode,
        reference: reference || undefined,
        avoirId:   mode === 'avoir' ? avoirId : undefined
      }
    });
    onSuccess();
  };

  const submitDisabled =
    paiementMutation.isPending ||
    !montant ||
    Number(montant) <= 0 ||
    (mode === 'avoir' && (!avoirId || Number(montant) > maxMontant));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Résumé facture */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-mono font-bold text-primary-600">
              {facture?.numero}
            </p>
            <p className="text-sm text-gray-600">
              {facture?.client?.nom} {facture?.client?.prenom}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Reste à payer</p>
            <p className="text-2xl font-bold text-red-600">
              {formatMontant(facture?.montantRestant)}
            </p>
          </div>
        </div>
      </div>

      {/* Mode */}
      <div>
        <label className="label">Mode de paiement</label>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m.v}
              type="button"
              onClick={() => handleModeChange(m.v)}
              className={`py-2 px-3 rounded-lg text-sm font-medium
                border-2 transition-colors ${
                  mode === m.v
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {m.l}
            </button>
          ))}
        </div>
      </div>

      {/* Sélecteur d'avoir */}
      {mode === 'avoir' && (
        <div>
          <label className="label">Avoir à utiliser *</label>
          {avoirsLoading ? (
            <p className="text-sm text-gray-400 p-3">Chargement des avoirs...</p>
          ) : avoirs.length === 0 ? (
            <p className="text-sm text-red-500 p-3 bg-red-50 rounded-xl">
              Aucun avoir disponible pour ce client.
            </p>
          ) : (
            <select
              value={avoirId}
              onChange={(e) => handleAvoirChange(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Choisir un avoir...</option>
              {avoirs.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.numero} — Crédit disponible : {formatMontant(a.soldeRestant)}
                </option>
              ))}
            </select>
          )}
          {avoirSelectionne && (
            <p className="text-xs text-gray-500 mt-1">
              Montant maximum utilisable : {formatMontant(maxMontant)}
            </p>
          )}
        </div>
      )}

      {/* Montant */}
      <div>
        <label className="label">Montant {mode === 'avoir' ? 'à utiliser' : 'encaissé'} *</label>
        <input
          type="number" min="0"
          max={mode === 'avoir' ? maxMontant : facture?.montantRestant}
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className="input-field text-xl font-bold text-center"
          disabled={mode === 'avoir' && !avoirId}
          required
        />
        {mode !== 'avoir' && Number(montant) > (facture?.montantRestant || 0) && (
          <p className="text-green-600 text-sm mt-1 font-medium">
            Monnaie à rendre : {formatMontant(monnaie)}
          </p>
        )}
        {mode === 'avoir' && avoirSelectionne && Number(montant) > maxMontant && (
          <p className="text-red-600 text-sm mt-1 font-medium">
            Le montant dépasse le crédit disponible ou le reste à payer.
          </p>
        )}
      </div>

      {/* Référence */}
      {['cheque', 'virement'].includes(mode) && (
        <div>
          <label className="label">Référence</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setRef(e.target.value)}
            className="input-field"
            placeholder="N° chèque / référence virement"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={submitDisabled}
        className="btn-primary w-full py-3 text-base font-semibold"
      >
        {paiementMutation.isPending
          ? 'Enregistrement...'
          : `Valider — ${formatMontant(Number(montant) || 0)}`}
      </button>
    </form>
  );
}