import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppLanguageContextType {
  language: 'no' | 'en';
  changeLanguage: (newLanguage: 'no' | 'en') => void;
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
  const [language, setLanguage] = useState<'no' | 'en'>('no'); // Default Norwegian

  useEffect(() => {
    // Read from localStorage (app-specific key)
    const savedLang = localStorage.getItem('mainAppLanguage') as 'no' | 'en' || 'no';
    console.log('App language context loading:', savedLang);
    setLanguage(savedLang);
  }, []);

  const changeLanguage = (newLang: 'no' | 'en') => {
    console.log('App language context changing to:', newLang);
    setLanguage(newLang);
    localStorage.setItem('mainAppLanguage', newLang);
  };

  return (
    <AppLanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </AppLanguageContext.Provider>
  );
};