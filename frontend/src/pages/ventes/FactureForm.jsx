import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCreateFacture } from '../../hooks/useVentes';
import ClientSelect from '../../components/ventes/ClientSelect';
import LignesDocument from '../../components/ventes/LignesDocument';
import { formatMontant } from '../../utils/format';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const MODES_PAIEMENT = [
  { v: 'especes',  l: 'Espèces' },
  { v: 'cheque',   l: 'Chèque' },
  { v: 'virement', l: 'Virement' },
  { v: 'carte',    l: 'Carte bancaire' },
];

export default function FactureForm({ onSuccess }) {
  const { magasinActif } = useAuthStore();
  const [client, setClient]           = useState(null);
  const [magasin, setMagasin]         = useState(magasinActif?._id || '');
  const [type, setType]               = useState('comptoir');
  const [remiseGlobale, setRemise]    = useState(0);
  const [notes, setNotes]             = useState('');
  const [montantPaye, setMontantPaye] = useState('');
  const [modePaiement, setMode]       = useState('especes');
  const [lignes, setLignes]           = useState([{
    article: '', designation: '', quantite: 1,
    prixUnitaire: 0, tva: 20, remise: 0,
    montantHT: 0, montantTTC: 0
  }]);

  const { data: magasinsData } = useQuery({
    queryKey: ['magasins'],
    queryFn: () => api.get('/magasins')
  });
  const magasins = magasinsData?.data || [];
  const createMutation = useCreateFacture();

  const totalTTC = lignes.reduce((s, l) => s + (l.montantTTC || 0), 0);
  const totalFinal = totalTTC * (1 - remiseGlobale / 100);
  const resteApayerCalc = totalFinal - (Number(montantPaye) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client) return alert('Veuillez sélectionner un client.');
    if (!magasin) return alert('Veuillez sélectionner un magasin.');
    if (lignes.some((l) => !l.article)) {
      return alert('Veuillez sélectionner tous les articles.');
    }

    const payload = {
      type, client: client._id, magasin,
      lignes: lignes.map((l) => ({
        article:      l.article,
        designation:  l.designation,
        quantite:     l.quantite,
        prixUnitaire: l.prixUnitaire,
        tva:          l.tva,
        remise:       l.remise || 0
      })),
      remiseGlobale: Number(remiseGlobale),
      notes: notes || undefined
    };

    if (montantPaye && Number(montantPaye) > 0) {
      payload.paiementInitial = {
        montant: Number(montantPaye),
        mode:    modePaiement
      };
    }

    await createMutation.mutateAsync(payload);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* En-tête */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Client *</label>
          <ClientSelect value={client} onChange={setClient} />
        </div>
        <div>
          <label className="label">Magasin *</label>
          <select value={magasin}
            onChange={(e) => setMagasin(e.target.value)}
            className="input-field" required>
            <option value="">Sélectionner...</option>
            {magasins.map((m) => (
              <option key={m._id} value={m._id}>{m.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Type de facture</label>
          <select value={type}
            onChange={(e) => setType(e.target.value)}
            className="input-field">
            <option value="comptoir">Comptoir</option>
            <option value="credit">Crédit</option>
            <option value="proforma">Proforma</option>
          </select>
        </div>
      </div>

      {/* Lignes */}
      <div>
        <label className="label">Articles *</label>
        <LignesDocument
          lignes={lignes}
          onChange={setLignes}
          magasinId={magasin}
        />
      </div>

      {/* Remise & Paiement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="label">Remise globale (%)</label>
          <input type="number" min="0" max="100"
            value={remiseGlobale}
            onChange={(e) => setRemise(Number(e.target.value))}
            className="input-field" />
        </div>

        {/* Section paiement */}
        <div className="bg-green-50 border border-green-200
                        rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-green-800">
            Paiement immédiat
          </p>
          <div>
            <label className="label text-green-700">
              Montant encaissé
            </label>
            <input
              type="number" min="0"
              value={montantPaye}
              onChange={(e) => setMontantPaye(e.target.value)}
              placeholder={`Max: ${formatMontant(totalFinal)}`}
              className="input-field"
            />
          </div>
          <div>
            <label className="label text-green-700">Mode de paiement</label>
            <select value={modePaiement}
              onChange={(e) => setMode(e.target.value)}
              className="input-field">
              {MODES_PAIEMENT.map((m) => (
                <option key={m.v} value={m.v}>{m.l}</option>
              ))}
            </select>
          </div>
          {montantPaye > 0 && (
            <div className="pt-2 border-t border-green-200">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Total TTC</span>
                <span className="font-bold text-green-800">
                  {formatMontant(totalFinal)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-green-700">Encaissé</span>
                <span className="font-bold text-green-600">
                  {formatMontant(Number(montantPaye))}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1
                              font-bold">
                <span className={resteApayerCalc > 0
                  ? 'text-red-600' : 'text-green-600'}>
                  {resteApayerCalc > 0 ? 'Reste à payer' : 'Monnaie'}
                </span>
                <span className={resteApayerCalc > 0
                  ? 'text-red-600' : 'text-green-600'}>
                  {formatMontant(Math.abs(resteApayerCalc))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2} className="input-field resize-none"
          placeholder="Notes optionnelles..." />
      </div>

      <button type="submit"
        disabled={createMutation.isPending}
        className="btn-primary w-full py-3 text-base font-semibold">
        {createMutation.isPending
          ? 'Création...'
          : `Créer la facture — ${formatMontant(totalFinal)}`}
      </button>
    </form>
  );
}