import { onMounted, onUnmounted } from 'vue';
import { Keyboard } from '@capacitor/keyboard';

export function useKeyboardFix() {
  onMounted(async () => {
    try {
      // Désactiver les comportements problématiques du clavier
      await Keyboard.setAccessoryBarVisible({ isVisible: false });
      await Keyboard.setScroll({ isDisabled: true });
      
      // Écouter les événements du clavier pour éviter les bugs de focus
      const keyboardWillShow = await Keyboard.addListener('keyboardWillShow', () => {
        // Ajouter un délai pour s'assurer que le clavier est bien positionné
        setTimeout(() => {
          // Re-appliquer les styles pour éviter les problèmes de layout
          document.documentElement.style.setProperty('--keyboard-height', '0px');
        }, 100);
      });

      const keyboardDidShow = await Keyboard.addListener('keyboardDidShow', (info) => {
        // Enregistrer la hauteur du clavier
        const keyboardHeight = info.keyboardHeight;
        document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
      });

      const keyboardWillHide = await Keyboard.addListener('keyboardWillHide', () => {
        document.documentElement.style.setProperty('--keyboard-height', '0px');
      });

      onUnmounted(() => {
        keyboardWillShow?.remove();
        keyboardDidShow?.remove();
        keyboardWillHide?.remove();
      });
    } catch (e) {
      console.warn('Keyboard setup failed:', e);
    }
  });
}
