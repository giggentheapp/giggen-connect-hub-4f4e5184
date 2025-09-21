import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [language, setLanguage] = useState<'no' | 'en'>('no'); // Default to Norwegian

  useEffect(() => {
    // Get language from localStorage or URL parameter
    const savedLanguage = localStorage.getItem('appLanguage') as 'no' | 'en' || 'no';
    const urlParams = new URLSearchParams(window.location.search);
    const urlLanguage = urlParams.get('lang') as 'no' | 'en';
    
    if (urlLanguage && ['no', 'en'].includes(urlLanguage)) {
      setLanguage(urlLanguage);
      localStorage.setItem('appLanguage', urlLanguage);
    } else {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (newLanguage: 'no' | 'en') => {
    setLanguage(newLanguage);
    localStorage.setItem('appLanguage', newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};