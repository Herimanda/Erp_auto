import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCreateDevis } from '../../hooks/useVentes';
import ClientSelect from '../../components/ventes/ClientSelect';
import LignesDocument from '../../components/ventes/LignesDocument';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function DevisForm({ onSuccess }) {
  const { magasinActif } = useAuthStore();
  const [client, setClient]           = useState(null);
  const [magasin, setMagasin]         = useState(magasinActif?._id || '');
  const [remiseGlobale, setRemise]    = useState(0);
  const [dateValidite, setDate]       = useState('');
  const [notes, setNotes]             = useState('');
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
  const createMutation = useCreateDevis();

  const totalTTC = lignes.reduce((s, l) => s + (l.montantTTC || 0), 0);
  const remiseMontant = totalTTC * (remiseGlobale / 100);
  const totalFinal = totalTTC - remiseMontant;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client) return alert('Veuillez sélectionner un client.');
    if (!magasin) return alert('Veuillez sélectionner un magasin.');
    if (lignes.some((l) => !l.article)) {
      return alert('Veuillez sélectionner tous les articles.');
    }

    await createMutation.mutateAsync({
      client: client._id,
      magasin,
      lignes: lignes.map((l) => ({
        article:      l.article,
        designation:  l.designation,
        quantite:     l.quantite,
        prixUnitaire: l.prixUnitaire,
        tva:          l.tva,
        remise:       l.remise || 0
      })),
      remiseGlobale: Number(remiseGlobale),
      dateValidite:  dateValidite || undefined,
      notes:         notes || undefined
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <label className="label">Remise globale (%)</label>
          <input type="number" min="0" max="100"
            value={remiseGlobale}
            onChange={(e) => setRemise(Number(e.target.value))}
            className="input-field" />
        </div>
        <div>
          <label className="label">Date de validité</label>
          <input type="date" value={dateValidite}
            onChange={(e) => setDate(e.target.value)}
            className="input-field" />
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
        {remiseGlobale > 0 && (
          <div className="flex justify-between text-sm mt-2
                          text-green-600 font-medium">
            <span>Remise globale ({remiseGlobale}%)</span>
            <span>— {formatMontant(remiseMontant)}</span>
          </div>
        )}
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
        className="btn-primary w-full py-3 text-base">
        {createMutation.isPending
          ? 'Création...' : 'Créer le devis'}
      </button>
    </form>
  );
}

// Helper local
const formatMontant = (v) =>
  new Intl.NumberFormat('fr-MG').format(v || 0) + ' Ar';