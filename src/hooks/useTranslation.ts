import { useAppLanguage } from '../contexts/AppLanguageContext';
import { translations } from '../translations';

export const useTranslation = () => {
  const { language } = useAppLanguage();
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  };
  
  return { t, language };
};