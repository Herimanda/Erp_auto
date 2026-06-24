import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useClients = (params = {}) => {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => api.get('/clients', { params }),
    keepPreviousData: true
  });
};

export const useClient = (id) => {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.get(`/clients/${id}`),
    enabled: !!id
  });
};

export const useHistoriqueClient = (id) => {
  return useQuery({
    queryKey: ['clients', id, 'historique'],
    queryFn: () => api.get(`/clients/${id}/historique`),
    enabled: !!id
  });
};

export const useTopClients = (params = {}) => {
  return useQuery({
    queryKey: ['clients', 'top', params],
    queryFn: () => api.get('/clients/stats/top', { params })
  });
};

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/clients', data),
    onSuccess: () => {
      qc.invalidateQueries(['clients']);
      toast.success('Client créé avec succès.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/clients/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['clients']);
      toast.success('Client modifié.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['clients']);
      toast.success('Client supprimé.');
    },
    onError: (err) => toast.error(err.message)
  });
};