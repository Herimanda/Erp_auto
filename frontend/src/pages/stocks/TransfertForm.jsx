import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateTransfert } from '../../hooks/useStocks';
import api from '../../services/api';

export default function TransfertForm({ onSuccess }) {
  const [magasinSource, setMagasinSource] = useState('');
  const [magasinDest, setMagasinDest] = useState('');
  const [lignes, setLignes] = useState([
    { article: '', quantiteDemandee: 1 }
  ]);

  const { data: magasinsData } = useQuery({
    queryKey: ['magasins'],
    queryFn: () => api.get('/magasins')
  });
  const { data: articlesData } = useQuery({
    queryKey: ['articles', 'select'],
    queryFn: () => api.get('/articles', { params: { limit: 200 } })
  });

  const magasins = magasinsData?.data || [];
  const articles = articlesData?.data?.articles || [];
  const createMutation = useCreateTransfert();

  const addLigne = () =>
    setLignes([...lignes, { article: '', quantiteDemandee: 1 }]);

  const removeLigne = (i) =>
    setLignes(lignes.filter((_, idx) => idx !== i));

  const updateLigne = (i, field, value) => {
    const copy = [...lignes];
    copy[i][field] = value;
    setLignes(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      magasinSource,
      magasinDestination: magasinDest,
      lignes: lignes.map((l) => ({
        article: l.article,
        quantiteDemandee: Number(l.quantiteDemandee)
      }))
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Magasin source *</label>
          <select
            value={magasinSource}
            onChange={(e) => setMagasinSource(e.target.value)}
            className="input-field" required
          >
            <option value="">Sélectionner...</option>
            {magasins.map((m) => (
              <option key={m._id} value={m._id}
                disabled={m._id === magasinDest}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Magasin destination *</label>
          <select
            value={magasinDest}
            onChange={(e) => setMagasinDest(e.target.value)}
            className="input-field" required
          >
            <option value="">Sélectionner...</option>
            {magasins.map((m) => (
              <option key={m._id} value={m._id}
                disabled={m._id === magasinSource}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lignes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Articles *</label>
          <button type="button" onClick={addLigne}
            className="text-sm text-primary-600 hover:text-primary-700
                       flex items-center gap-1">
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {lignes.map((ligne, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={ligne.article}
                onChange={(e) => updateLigne(i, 'article', e.target.value)}
                className="input-field flex-1" required
              >
                <option value="">Article...</option>
                {articles.map((a) => (
                  <option key={a._id} value={a._id}>
                    [{a.reference}] {a.designation}
                  </option>
                ))}
              </select>
              <input
                type="number" min="1"
                value={ligne.quantiteDemandee}
                onChange={(e) =>
                  updateLigne(i, 'quantiteDemandee', e.target.value)}
                className="input-field w-24"
                placeholder="Qté"
                required
              />
              {lignes.length > 1 && (
                <button type="button" onClick={() => removeLigne(i)}
                  className="p-2 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="btn-primary w-full"
      >
        {createMutation.isPending
          ? 'Création...' : 'Créer le transfert'}
      </button>
    </form>
  );
}