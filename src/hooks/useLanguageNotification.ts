import { useEffect, useState } from 'react';
import { useAppLanguage } from '@/contexts/AppLanguageContext';

export const useLanguageNotification = () => {
  const { language } = useAppLanguage();
  const [prevLanguage, setPrevLanguage] = useState<string | null>(null);

  useEffect(() => {
    if (prevLanguage !== null && prevLanguage !== language) {
      // Show brief confirmation
      const notification = document.createElement('div');
      notification.textContent = `Language changed to ${language === 'en' ? 'English' : 'Norsk'}`;
      notification.className = 'language-change-notification';
      document.body.appendChild(notification);

      // Auto-remove after animation
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
    setPrevLanguage(language);
  }, [language, prevLanguage]);
};