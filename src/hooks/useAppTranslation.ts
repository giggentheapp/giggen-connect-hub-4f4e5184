import { useAppLanguage } from '../contexts/AppLanguageContext';
import { appTranslations } from '../translations/appTranslations';

export const useAppTranslation = () => {
  const { language } = useAppLanguage();
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = appTranslations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  };
  
  return { t, language };
};