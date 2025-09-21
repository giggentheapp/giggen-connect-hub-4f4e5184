import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageService } from '../services/languageService';

interface LanguageContextType {
  language: 'no' | 'en';
  changeLanguage: (newLanguage: 'no' | 'en') => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<'no' | 'en'>('no');

  useEffect(() => {
    // Read initial language from shared service
    const currentLang = LanguageService.getCurrentLanguage();
    console.log('Main app reading language:', currentLang);
    setLanguage(currentLang);
    
    // Listen for language changes from any part of the app
    const unsubscribe = LanguageService.onLanguageChange((newLang) => {
      console.log('Main app received language change:', newLang);
      setLanguage(newLang);
    });
    
    // Check URL parameter on app startup
    const urlParams = new URLSearchParams(window.location.search);
    const urlLanguage = urlParams.get('lang') as 'no' | 'en';
    if (urlLanguage && ['no', 'en'].includes(urlLanguage)) {
      LanguageService.setLanguage(urlLanguage);
    }
    
    return unsubscribe;
  }, []);

  const changeLanguage = (newLanguage: 'no' | 'en') => {
    LanguageService.setLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};