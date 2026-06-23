import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useStockGlobal = () => {
  return useQuery({
    queryKey: ['stocks', 'global'],
    queryFn: () => api.get('/stocks/global'),
    refetchInterval: 30000 // Rafraîchir toutes les 30s
  });
};

export const useStockMagasin = (magasinId, params = {}) => {
  return useQuery({
    queryKey: ['stocks', 'magasin', magasinId, params],
    queryFn: () => api.get(`/stocks/magasin/${magasinId}`, { params }),
    enabled: !!magasinId,
    keepPreviousData: true
  });
};

export const useStockArticle = (articleId) => {
  return useQuery({
    queryKey: ['stocks', 'article', articleId],
    queryFn: () => api.get(`/stocks/article/${articleId}`),
    enabled: !!articleId
  });
};

export const useMouvements = (params = {}) => {
  return useQuery({
    queryKey: ['mouvements', params],
    queryFn: () => api.get('/mouvements', { params }),
    keepPreviousData: true
  });
};

export const useEntreeStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/mouvements/entree', data),
    onSuccess: () => {
      qc.invalidateQueries(['stocks']);
      qc.invalidateQueries(['mouvements']);
      toast.success('Entrée de stock enregistrée.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useSortieStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/mouvements/sortie', data),
    onSuccess: () => {
      qc.invalidateQueries(['stocks']);
      qc.invalidateQueries(['mouvements']);
      toast.success('Sortie de stock enregistrée.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useAjustementStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/mouvements/ajustement', data),
    onSuccess: () => {
      qc.invalidateQueries(['stocks']);
      qc.invalidateQueries(['mouvements']);
      toast.success('Stock ajusté.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useTransferts = (params = {}) => {
  return useQuery({
    queryKey: ['transferts', params],
    queryFn: () => api.get('/transferts', { params }),
    keepPreviousData: true
  });
};

export const useCreateTransfert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/transferts', data),
    onSuccess: () => {
      qc.invalidateQueries(['transferts']);
      qc.invalidateQueries(['stocks']);
      toast.success('Transfert créé.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useActionTransfert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, data }) =>
      api.put(`/transferts/${id}/${action}`, data || {}),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['transferts']);
      qc.invalidateQueries(['stocks']);
      const msgs = {
        valider: 'Transfert validé.',
        expedier: 'Transfert expédié.',
        receptionner: 'Transfert réceptionné.',
        annuler: 'Transfert annulé.'
      };
      toast.success(msgs[vars.action] || 'Action effectuée.');
    },
    onError: (err) => toast.error(err.message)
  });
};