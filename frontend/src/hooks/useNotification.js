import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useNotifications = (params = {}) => useQuery({
  queryKey: ['notifications', params],
  queryFn:  () => api.get('/notifications', { params }),
  keepPreviousData: true
});

export const useCompteurNotifications = () => useQuery({
  queryKey: ['notifications', 'compteur'],
  queryFn:  () => api.get('/notifications/compteur'),
  refetchInterval: 1000 * 30 // toutes les 30s
});

export const useMarquerLue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/lu`),
    onSuccess: () => qc.invalidateQueries(['notifications'])
  });
};

export const useToutMarquerLu = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/notifications/tout-lire'),
    onSuccess: () => {
      qc.invalidateQueries(['notifications']);
      toast.success('Toutes les notifications ont été lues.');
    }
  });
};

export const useSupprimerNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries(['notifications'])
  });
};

export const useViderLues = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/notifications/lues'),
    onSuccess: () => {
      qc.invalidateQueries(['notifications']);
      toast.success('Notifications lues supprimées.');
    }
  });
};