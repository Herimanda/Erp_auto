import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useFournisseurs = (params = {}) => {
  return useQuery({
    queryKey: ['fournisseurs', params],
    queryFn: () => api.get('/fournisseurs', { params }),
    keepPreviousData: true
  });
};

export const useFournisseur = (id) => {
  return useQuery({
    queryKey: ['fournisseurs', id],
    queryFn: () => api.get(`/fournisseurs/${id}`),
    enabled: !!id
  });
};

export const useHistoriqueFournisseur = (id) => {
  return useQuery({
    queryKey: ['fournisseurs', id, 'historique'],
    queryFn: () => api.get(`/fournisseurs/${id}/historique`),
    enabled: !!id
  });
};

export const useCreateFournisseur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/fournisseurs', data),
    onSuccess: () => {
      qc.invalidateQueries(['fournisseurs']);
      toast.success('Fournisseur créé.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useUpdateFournisseur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/fournisseurs/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['fournisseurs']);
      toast.success('Fournisseur modifié.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useDeleteFournisseur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/fournisseurs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['fournisseurs']);
      toast.success('Fournisseur supprimé.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useCommandes = (params = {}) => {
  return useQuery({
    queryKey: ['commandes-fournisseur', params],
    queryFn: () => api.get('/commandes-fournisseur', { params }),
    keepPreviousData: true
  });
};

export const useCommande = (id) => {
  return useQuery({
    queryKey: ['commandes-fournisseur', id],
    queryFn: () => api.get(`/commandes-fournisseur/${id}`),
    enabled: !!id
  });
};

export const useCreateCommande = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/commandes-fournisseur', data),
    onSuccess: () => {
      qc.invalidateQueries(['commandes-fournisseur']);
      toast.success('Commande créée.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useActionCommande = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, data }) =>
      api.put(`/commandes-fournisseur/${id}/${action}`, data || {}),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['commandes-fournisseur']);
      qc.invalidateQueries(['stocks']);
      const msgs = {
        valider:       'Commande validée.',
        annuler:       'Commande annulée.',
        receptionner:  'Réception enregistrée. Stock mis à jour.'
      };
      toast.success(msgs[vars.action] || 'Action effectuée.');
    },
    onError: (err) => toast.error(err.message)
  });
};