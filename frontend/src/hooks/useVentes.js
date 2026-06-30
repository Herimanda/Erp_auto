import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Devis ──────────────────────────────────────────────
export const useDevis = (params = {}) => useQuery({
  queryKey: ['devis', params],
  queryFn: () => api.get('/devis', { params }),
  keepPreviousData: true
});

export const useUnDevis = (id) => useQuery({
  queryKey: ['devis', id],
  queryFn: () => api.get(`/devis/${id}`),
  enabled: !!id
});

export const useCreateDevis = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/devis', data),
    onSuccess: () => {
      qc.invalidateQueries(['devis']);
      toast.success('Devis créé.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useUpdateDevisStatut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }) =>
      api.put(`/devis/${id}/statut`, { statut }),
    onSuccess: () => {
      qc.invalidateQueries(['devis']);
      toast.success('Statut mis à jour.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useConvertirDevis = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type }) =>
      api.post(`/devis/${id}/convertir`, { type }),
    onSuccess: () => {
      qc.invalidateQueries(['devis']);
      qc.invalidateQueries(['factures']);
      qc.invalidateQueries(['stocks']);
      toast.success('Devis converti en facture.');
    },
    onError: (err) => toast.error(err.message)
  });
};

// ── Factures ───────────────────────────────────────────
export const useFactures = (params = {}) => useQuery({
  queryKey: ['factures', params],
  queryFn: () => api.get('/factures', { params }),
  keepPreviousData: true
});

export const useFacture = (id) => useQuery({
  queryKey: ['factures', id],
  queryFn: () => api.get(`/factures/${id}`),
  enabled: !!id
});

export const useFacturesImpayees = (params = {}) => useQuery({
  queryKey: ['factures', 'impayes', params],
  queryFn: () => api.get('/factures/alertes/impayes', { params })
});

export const useCreateFacture = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/factures', data),
    onSuccess: () => {
      qc.invalidateQueries(['factures']);
      qc.invalidateQueries(['stocks']);
      qc.invalidateQueries(['clients']);
      toast.success('Facture créée.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const usePaiement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      api.post(`/factures/${id}/paiement`, data),
    onSuccess: () => {
      qc.invalidateQueries(['factures']);
      qc.invalidateQueries(['clients']);
      toast.success('Paiement enregistré.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useAnnulerFacture = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.put(`/factures/${id}/annuler`),
    onSuccess: () => {
      qc.invalidateQueries(['factures']);
      qc.invalidateQueries(['stocks']);
      toast.success('Facture annulée.');
    },
    onError: (err) => toast.error(err.message)
  });
};

// ── Avoirs ─────────────────────────────────────────────
export const useAvoirs = (params = {}) => useQuery({
  queryKey: ['avoirs', params],
  queryFn: () => api.get('/avoirs', { params }),
  keepPreviousData: true
});

export const useAvoir = (id) => useQuery({
  queryKey: ['avoirs', id],
  queryFn: () => api.get(`/avoirs/${id}`),
  enabled: !!id
});

export const useCreateAvoir = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/avoirs', data),
    onSuccess: () => {
      qc.invalidateQueries(['avoirs']);
      qc.invalidateQueries(['stocks']);
      qc.invalidateQueries(['clients']);
      toast.success('Avoir créé.');
    },
    onError: (err) => toast.error(err.message)
  });
};

// Ajouter ces deux hooks

export const useValiderAvoir = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/avoirs/${id}/valider`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avoirs'] })
  });
};

export const useAnnulerAvoir = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/avoirs/${id}/annuler`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avoirs'] })
  });
};

// Pour récupérer les avoirs valides d'un client (pour PaiementForm)
export const useAvoirsClient = (clientId) =>
  useQuery({
    queryKey: ['avoirs', 'client', clientId],
    queryFn: () => api.get('/avoirs', {
      params: { client: clientId, statut: 'valide', limit: 50 }
    }),
    enabled: !!clientId
  });