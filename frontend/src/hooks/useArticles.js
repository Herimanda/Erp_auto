import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useArticles = (params = {}) => {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => api.get('/articles', { params }),
    keepPreviousData: true
  });
};

export const useArticle = (id) => {
  return useQuery({
    queryKey: ['articles', id],
    queryFn: () => api.get(`/articles/${id}`),
    enabled: !!id
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories')
  });
};

export const useMarques = () => {
  return useQuery({
    queryKey: ['marques'],
    queryFn: () => api.get('/articles/meta/marques')
  });
};

export const useCreateArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/articles', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      qc.invalidateQueries(['articles']);
      toast.success('Article créé avec succès.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useUpdateArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/articles/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      qc.invalidateQueries(['articles']);
      toast.success('Article modifié avec succès.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useDeleteArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/articles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['articles']);
      toast.success('Article supprimé.');
    },
    onError: (err) => toast.error(err.message)
  });
};

export const useStockFaible = (params = {}) => {
  return useQuery({
    queryKey: ['articles', 'stock-faible', params],
    queryFn: () => api.get('/articles/alertes/stock-faible', { params })
  });
};