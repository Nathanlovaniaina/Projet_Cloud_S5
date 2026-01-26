import { ref, watch, onMounted } from 'vue';

export const isDarkMode = ref(false);

export function useTheme() {
  // Initialiser depuis localStorage ou système
  function initTheme() {
    const saved = localStorage.getItem('theme-mode');
    
    if (saved) {
      isDarkMode.value = saved === 'dark';
    } else {
      // Détecter depuis le système
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    applyTheme();
  }

  function applyTheme() {
    const htmlElement = document.documentElement;
    
    if (isDarkMode.value) {
      htmlElement.style.colorScheme = 'dark';
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      htmlElement.style.colorScheme = 'light';
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
    
    // Sauvegarder le choix
    localStorage.setItem('theme-mode', isDarkMode.value ? 'dark' : 'light');
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
  }

  // Watcher pour appliquer les changements
  watch(isDarkMode, () => {
    applyTheme();
  });

  // Écouter les changements système
  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('theme-mode');
      if (!saved) {
        isDarkMode.value = e.matches;
      }
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  });

  return {
    isDarkMode,
    initTheme,
    toggleDarkMode,
    applyTheme
  };
}
