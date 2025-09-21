export const LanguageService = {
  // Get current language from localStorage
  getCurrentLanguage: (): 'no' | 'en' => {
    const stored = localStorage.getItem('appLanguage');
    return (stored === 'en' || stored === 'no') ? stored : 'no';
  },
  
  // Set language and save to localStorage  
  setLanguage: (language: 'no' | 'en') => {
    localStorage.setItem('appLanguage', language);
    // Trigger custom event for other parts to listen
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language } 
    }));
  },
  
  // Subscribe to language changes
  onLanguageChange: (callback: (language: 'no' | 'en') => void) => {
    const handler = (event: CustomEvent<{ language: 'no' | 'en' }>) => 
      callback(event.detail.language);
    window.addEventListener('languageChanged', handler as EventListener);
    return () => window.removeEventListener('languageChanged', handler as EventListener);
  }
};