import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

export const initStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Couleur de fond de la status bar = couleur de ta sidebar
    await StatusBar.setBackgroundColor({ color: '#1e2a3b' });

    // Texte/icônes en blanc (car fond sombre)
    await StatusBar.setStyle({ style: Style.Dark });

    // Empêche le contenu de passer SOUS la status bar
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn('StatusBar non disponible:', err);
  }
};

export const initKeyboard = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    Keyboard.setResizeMode({ mode: 'body' }); // pousse le contenu au lieu de le recouvrir
    Keyboard.setScroll({ isDisabled: false });
  } catch (err) {
    console.warn('Keyboard plugin non disponible:', err);
  }
};