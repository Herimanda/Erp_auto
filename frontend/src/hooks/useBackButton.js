import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import useUiStore from '../store/uiStore';

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('backButton', () => {
      const modalClose = useUiStore.getState().modalOpenCallback;

      // Priorité 1 : fermer une modale ouverte
      if (modalClose) {
        modalClose();
        return;
      }

      // Priorité 2 : confirmation de sortie sur le dashboard
      if (location.pathname === '/dashboard') {
        if (window.confirm('Voulez-vous quitter ERP Auto ?')) {
          App.exitApp();
        }
        return;
      }

      // Priorité 3 : navigation arrière
      navigate(-1);
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [location, navigate]);
}