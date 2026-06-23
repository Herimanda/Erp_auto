import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import {
  useEntreeStock, useSortieStock, useAjustementStock
} from '../../hooks/useStocks';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function MouvementForm({ type, onSuccess }) {
  const { magasinActif } = useAuthStore();

  const { data: articlesData } = useQuery({
    queryKey: ['articles', 'select'],
    queryFn: () => api.get('/articles', { params: { limit: 200 } })
  });
  const { data: magasinsData } = useQuery({
    queryKey: ['magasins'],
    queryFn: () => api.get('/magasins')
  });

  const articles = articlesData?.data?.articles || [];
  const magasins = magasinsData?.data || [];

  const entreeMutation  = useEntreeStock();
  const sortieMutation  = useSortieStock();
  const ajustMutation   = useAjustementStock();

  const isLoading =
    entreeMutation.isPending ||
    sortieMutation.isPending ||
    ajustMutation.isPending;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { magasinId: magasinActif?._id }
  });

  const onSubmit = async (data) => {
    if (type === 'entree') {
      await entreeMutation.mutateAsync({
        articleId: data.articleId,
        magasinId: data.magasinId,
        quantite: Number(data.quantite),
        type: data.type,
        motif: data.motif,
        prixUnitaire: data.prixUnitaire
          ? Number(data.prixUnitaire) : undefined
      });
    } else if (type === 'sortie') {
      await sortieMutation.mutateAsync({
        articleId: data.articleId,
        magasinId: data.magasinId,
        quantite: Number(data.quantite),
        type: data.type,
        motif: data.motif
      });
    } else {
      await ajustMutation.mutateAsync({
        articleId: data.articleId,
        magasinId: data.magasinId,
        nouvelleQuantite: Number(data.nouvelleQuantite),
        motif: data.motif
      });
    }
    onSuccess();
  };

  const entreesTypes = [
    { v: 'achat_fournisseur',  l: 'Achat fournisseur' },
    { v: 'retour_client',      l: 'Retour client' },
    { v: 'ajustement_positif', l: 'Ajustement positif' },
  ];
  const sortiesTypes = [
    { v: 'retour_fournisseur', l: 'Retour fournisseur' },
    { v: 'ajustement_negatif', l: 'Ajustement négatif' },
  ];
  const motifsAjust = [
    { v: 'casse',             l: 'Casse' },
    { v: 'perte',             l: 'Perte' },
    { v: 'vol',               l: 'Vol' },
    { v: 'correction_erreur', l: 'Correction d\'erreur' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Article *</label>
        <select {...register('articleId', { required: true })}
          className="input-field">
          <option value="">Sélectionner un article...</option>
          {articles.map((a) => (
            <option key={a._id} value={a._id}>
              [{a.reference}] {a.designation}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Magasin *</label>
        <select {...register('magasinId', { required: true })}
          className="input-field">
          <option value="">Sélectionner un magasin...</option>
          {magasins.map((m) => (
            <option key={m._id} value={m._id}>{m.nom}</option>
          ))}
        </select>
      </div>

      {type === 'entree' && (
        <>
          <div>
            <label className="label">Type d'entrée *</label>
            <select {...register('type', { required: true })}
              className="input-field">
              {entreesTypes.map((t) => (
                <option key={t.v} value={t.v}>{t.l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Quantité *</label>
            <input
              type="number" min="1"
              {...register('quantite', { required: true, min: 1 })}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Prix unitaire (optionnel)</label>
            <input
              type="number"
              {...register('prixUnitaire')}
              className="input-field"
              placeholder="Laisser vide pour conserver le prix actuel"
            />
          </div>
        </>
      )}

      {type === 'sortie' && (
        <>
          <div>
            <label className="label">Type de sortie *</label>
            <select {...register('type', { required: true })}
              className="input-field">
              {sortiesTypes.map((t) => (
                <option key={t.v} value={t.v}>{t.l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Quantité *</label>
            <input
              type="number" min="1"
              {...register('quantite', { required: true, min: 1 })}
              className="input-field"
            />
          </div>
        </>
      )}

      {type === 'ajustement' && (
        <>
          <div>
            <label className="label">Nouvelle quantité *</label>
            <input
              type="number" min="0"
              {...register('nouvelleQuantite', { required: true, min: 0 })}
              className="input-field"
              placeholder="Quantité physique réelle"
            />
          </div>
          <div>
            <label className="label">Motif *</label>
            <select {...register('motif', { required: true })}
              className="input-field">
              <option value="">Sélectionner un motif...</option>
              {motifsAjust.map((m) => (
                <option key={m.v} value={m.v}>{m.l}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}