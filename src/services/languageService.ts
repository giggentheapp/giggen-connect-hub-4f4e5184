export class LanguageService {
  static STORAGE_KEY = 'giggen_app_language';
  static DEFAULT_LANGUAGE = 'no';
  static SUPPORTED_LANGUAGES = ['no', 'en'] as const;
  
  // Get current language from localStorage
  static getCurrentLanguage(): 'no' | 'en' {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored && this.SUPPORTED_LANGUAGES.includes(stored as any)) {
      return stored as 'no' | 'en';
    }
    return this.DEFAULT_LANGUAGE as 'no' | 'en';
  }
  
  // Set language and notify all listeners
  static setLanguage(language: 'no' | 'en'): boolean {
    if (!this.SUPPORTED_LANGUAGES.includes(language)) {
      console.warn(`Unsupported language: ${language}`);
      return false;
    }
    
    console.log(`Setting app language to: ${language}`);
    localStorage.setItem(this.STORAGE_KEY, language);
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language, timestamp: Date.now() } 
    }));
    
    return true;
  }
  
  // Subscribe to language changes
  static onLanguageChange(callback: (language: 'no' | 'en', timestamp?: number) => void) {
    const handler = (event: CustomEvent<{ language: 'no' | 'en'; timestamp: number }>) => {
      callback(event.detail.language, event.detail.timestamp);
    };
    window.addEventListener('languageChanged', handler as EventListener);
    
    // Return unsubscribe function
    return () => window.removeEventListener('languageChanged', handler as EventListener);
  }
  
  // Initialize language on app start
  static initializeLanguage(): 'no' | 'en' {
    const currentLang = this.getCurrentLanguage();
    console.log(`Initializing app with language: ${currentLang}`);
    
    // Set document language attribute for accessibility
    document.documentElement.setAttribute('lang', currentLang);
    
    return currentLang;
  }
  
  // Initialize language from URL parameter
  static initializeFromURL(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam && this.SUPPORTED_LANGUAGES.includes(langParam as any)) {
      console.log('Setting language from URL parameter:', langParam);
      this.setLanguage(langParam as 'no' | 'en');
      
      // Clean URL without reloading page
      const url = new URL(window.location.href);
      url.searchParams.delete('lang');
      window.history.replaceState({}, '', url.toString());
    }
  }
}