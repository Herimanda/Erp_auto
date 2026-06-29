import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useFeuille = (magasinId, params = {}) => useQuery({
  queryKey: ['inventaire', 'feuille', magasinId, params],
  queryFn:  () => api.get(`/inventaire/${magasinId}`, { params }),
  enabled:  !!magasinId
});

export const useValiderInventaire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ magasinId, lignes }) =>
      api.post(`/inventaire/${magasinId}/valider`, { lignes }),
    onSuccess: (data) => {
      qc.invalidateQueries(['stocks']);
      qc.invalidateQueries(['inventaire']);
      qc.invalidateQueries(['mouvements']);
      const nb = data?.data?.resume?.nbEcarts || 0;
      toast.success(`Inventaire validé. ${nb} écart(s) corrigé(s).`);
    },
    onError: (err) => toast.error(err.message)
  });
};