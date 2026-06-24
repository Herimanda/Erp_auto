import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const opts = { staleTime: 1000 * 60 * 2 }; // 2 minutes

export const useKpis = (magasin) => useQuery({
  queryKey: ['dashboard', 'kpis', magasin],
  queryFn: () => api.get('/dashboard/kpis',
    { params: magasin ? { magasin } : {} }),
  ...opts,
  refetchInterval: 1000 * 60 * 5
});

export const useCaJournalier = (magasin) => useQuery({
  queryKey: ['dashboard', 'ca-journalier', magasin],
  queryFn: () => api.get('/dashboard/ca-journalier',
    { params: magasin ? { magasin } : {} }),
  ...opts
});

export const useCaMensuel = (magasin) => useQuery({
  queryKey: ['dashboard', 'ca-mensuel', magasin],
  queryFn: () => api.get('/dashboard/ca-mensuel',
    { params: magasin ? { magasin } : {} }),
  ...opts
});

export const useTopProduits = (magasin, periode = 'mois') => useQuery({
  queryKey: ['dashboard', 'top-produits', magasin, periode],
  queryFn: () => api.get('/dashboard/top-produits',
    { params: { ...(magasin && { magasin }), periode } }),
  ...opts
});

export const useCaCategories = (magasin) => useQuery({
  queryKey: ['dashboard', 'ca-categories', magasin],
  queryFn: () => api.get('/dashboard/ca-categories',
    { params: magasin ? { magasin } : {} }),
  ...opts
});

export const useDernieresVentes = (magasin) => useQuery({
  queryKey: ['dashboard', 'dernieres-ventes', magasin],
  queryFn: () => api.get('/dashboard/dernieres-ventes',
    { params: magasin ? { magasin } : {} }),
  ...opts,
  refetchInterval: 1000 * 30
});

export const useAlertes = (magasin) => useQuery({
  queryKey: ['dashboard', 'alertes', magasin],
  queryFn: () => api.get('/dashboard/alertes',
    { params: magasin ? { magasin } : {} }),
  ...opts,
  refetchInterval: 1000 * 60
});