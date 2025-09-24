import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageService } from '../services/languageService';

interface AppLanguageContextType {
  language: 'no' | 'en';
  changeLanguage: (newLanguage: 'no' | 'en') => void;
  availableLanguages: readonly string[];
}

const AppLanguageContext = createContext<AppLanguageContextType | undefined>(undefined);

export const useAppLanguage = () => {
  const context = useContext(AppLanguageContext);
  if (!context) {
    throw new Error('useAppLanguage must be used within AppLanguageProvider');
  }
  return context;
};

interface AppLanguageProviderProps {
  children: React.ReactNode;
}

export const AppLanguageProvider = ({ children }: AppLanguageProviderProps) => {
  const [language, setLanguageState] = useState(() => {
    return LanguageService.initializeLanguage();
  });

  useEffect(() => {
    console.log('AppLanguageProvider initialized with language:', language);
    
    // Initialize from URL parameter
    LanguageService.initializeFromURL();
    
    // Listen for language changes from any source
    const unsubscribe = LanguageService.onLanguageChange((newLanguage, timestamp) => {
      console.log('AppLanguageProvider received language change:', newLanguage, timestamp);
      setLanguageState(newLanguage);
      
      // Update document language for accessibility
      document.documentElement.setAttribute('lang', newLanguage);
    });
    
    return unsubscribe;
  }, []);

  const changeLanguage = (newLanguage: 'no' | 'en') => {
    const success = LanguageService.setLanguage(newLanguage);
    if (success) {
      console.log('Language changed successfully to:', newLanguage);
    } else {
      console.error('Failed to change language to:', newLanguage);
    }
  };

  return (
    <AppLanguageContext.Provider value={{ 
      language, 
      changeLanguage,
      availableLanguages: LanguageService.SUPPORTED_LANGUAGES
    }}>
      {children}
    </AppLanguageContext.Provider>
  );
};