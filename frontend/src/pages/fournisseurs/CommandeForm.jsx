import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCreateCommande } from '../../hooks/useFournisseurs';
import { formatMontant } from '../../utils/format';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function CommandeForm({ onSuccess }) {
  const { magasinActif } = useAuthStore();
  const [fournisseur, setFournisseur] = useState('');
  const [magasin, setMagasin]         = useState(magasinActif?._id || '');
  const [dateLivraison, setDate]      = useState('');
  const [notes, setNotes]             = useState('');
  const [lignes, setLignes]           = useState([
    { article: '', quantiteCommandee: 1, prixUnitaire: '' }
  ]);

  const { data: foursData }    = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: () => api.get('/fournisseurs', { params: { limit: 100 } })
  });
  const { data: magasinsData } = useQuery({
    queryKey: ['magasins'],
    queryFn: () => api.get('/magasins')
  });
  const { data: articlesData } = useQuery({
    queryKey: ['articles', 'select'],
    queryFn: () => api.get('/articles', { params: { limit: 200 } })
  });

  const fournisseurs = foursData?.data?.fournisseurs || [];
  const magasins     = magasinsData?.data || [];
  const articles     = articlesData?.data?.articles || [];
  const createMutation = useCreateCommande();

  const updateLigne = (i, field, value) => {
    const copy = [...lignes];
    copy[i][field] = value;
    // Pré-remplir prix achat
    if (field === 'article') {
      const art = articles.find((a) => a._id === value);
      if (art) copy[i].prixUnitaire = art.prixAchat;
    }
    setLignes(copy);
  };

  const totalHT = lignes.reduce((s, l) => {
    return s + (Number(l.quantiteCommandee) * Number(l.prixUnitaire || 0));
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      fournisseur,
      magasin,
      lignes: lignes.map((l) => ({
        article:           l.article,
        quantiteCommandee: Number(l.quantiteCommandee),
        prixUnitaire:      l.prixUnitaire ? Number(l.prixUnitaire) : undefined
      })),
      dateLivraisonPrevue: dateLivraison || undefined,
      notes: notes || undefined
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Fournisseur *</label>
          <select value={fournisseur}
            onChange={(e) => setFournisseur(e.target.value)}
            className="input-field" required>
            <option value="">Sélectionner...</option>
            {fournisseurs.map((f) => (
              <option key={f._id} value={f._id}>
                {f.raisonSociale}
              </option>
            ))}
          </select>
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
          <label className="label">Livraison prévue</label>
          <input type="date" value={dateLivraison}
            onChange={(e) => setDate(e.target.value)}
            className="input-field" />
        </div>
      </div>

      {/* Lignes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Articles *</label>
          <button type="button"
            onClick={() => setLignes([
              ...lignes,
              { article: '', quantiteCommandee: 1, prixUnitaire: '' }
            ])}
            className="text-sm text-primary-600 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>

        {/* Entête */}
        <div className="grid grid-cols-12 gap-2 text-xs font-medium
                        text-gray-500 uppercase px-1 mb-1">
          <span className="col-span-6">Article</span>
          <span className="col-span-2 text-center">Qté</span>
          <span className="col-span-3 text-right">Prix achat</span>
          <span className="col-span-1" />
        </div>

        <div className="space-y-2">
          {lignes.map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <select
                value={l.article}
                onChange={(e) => updateLigne(i, 'article', e.target.value)}
                className="input-field col-span-6 text-sm" required>
                <option value="">Article...</option>
                {articles.map((a) => (
                  <option key={a._id} value={a._id}>
                    [{a.reference}] {a.designation}
                  </option>
                ))}
              </select>
              <input
                type="number" min="1"
                value={l.quantiteCommandee}
                onChange={(e) =>
                  updateLigne(i, 'quantiteCommandee', e.target.value)}
                className="input-field col-span-2 text-center text-sm"
                required />
              <input
                type="number" min="0"
                value={l.prixUnitaire}
                onChange={(e) =>
                  updateLigne(i, 'prixUnitaire', e.target.value)}
                placeholder="Prix"
                className="input-field col-span-3 text-right text-sm" />
              {lignes.length > 1 && (
                <button type="button"
                  onClick={() =>
                    setLignes(lignes.filter((_, idx) => idx !== i))}
                  className="col-span-1 text-red-400 hover:text-red-600
                             flex justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-end mt-3 pt-3
                        border-t border-gray-200">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total HT</p>
            <p className="text-xl font-bold text-gray-900">
              {formatMontant(totalHT)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={2} className="input-field resize-none"
          placeholder="Notes optionnelles..." />
      </div>

      <button type="submit" disabled={createMutation.isPending}
        className="btn-primary w-full">
        {createMutation.isPending ? 'Création...' : 'Créer la commande'}
      </button>
    </form>
  );
}