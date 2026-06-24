import { useState } from 'react';
import { usePaiement } from '../../hooks/useVentes';
import { formatMontant } from '../../utils/format';

const MODES = [
  { v: 'especes',  l: 'Espèces' },
  { v: 'cheque',   l: 'Chèque' },
  { v: 'virement', l: 'Virement' },
  { v: 'carte',    l: 'Carte bancaire' },
  { v: 'avoir',    l: 'Avoir' },
];

export default function PaiementForm({ facture, onSuccess }) {
  const [montant, setMontant] = useState(facture?.montantRestant || '');
  const [mode, setMode]       = useState('especes');
  const [reference, setRef]   = useState('');

  const paiementMutation = usePaiement();

  const monnaie = Number(montant) - (facture?.montantRestant || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(montant) <= 0) return;
    await paiementMutation.mutateAsync({
      id: facture._id,
      data: {
        montant:   Number(montant),
        mode,
        reference: reference || undefined
      }
    });
    onSuccess();
  };

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

      {/* Montant */}
      <div>
        <label className="label">Montant encaissé *</label>
        <input
          type="number" min="0"
          max={facture?.montantRestant}
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className="input-field text-xl font-bold text-center"
          required
        />
        {Number(montant) > (facture?.montantRestant || 0) && (
          <p className="text-green-600 text-sm mt-1 font-medium">
            Monnaie à rendre : {formatMontant(monnaie)}
          </p>
        )}
      </div>

      {/* Mode */}
      <div>
        <label className="label">Mode de paiement</label>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m.v}
              type="button"
              onClick={() => setMode(m.v)}
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
        disabled={paiementMutation.isPending || !montant}
        className="btn-primary w-full py-3 text-base font-semibold"
      >
        {paiementMutation.isPending
          ? 'Enregistrement...'
          : `Valider — ${formatMontant(Number(montant))}`}
      </button>
    </form>
  );
}