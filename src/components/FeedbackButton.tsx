import { MessageCircle } from 'lucide-react';
import { useAppTranslation } from '../hooks/useAppTranslation';
import { useAppLanguage } from '../contexts/AppLanguageContext';

const FeedbackButton = () => {
  const { t } = useAppTranslation();
  const { language } = useAppLanguage();
  
  // Use different Tally form IDs based on language
  const tallyId = language === 'en' ? 'mOvdxY' : 'nr7Bq5';
  
  return (
    <button 
      data-tally-open={tallyId}
      data-tally-emoji-text="👋" 
      data-tally-emoji-animation="wave"
      className="floating-feedback-btn-mobile print:hidden"
      title={t('feedback')}
      aria-label={t('feedback')}
    >
      <div className="feedback-icon-wrapper">
        <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
        <div className="feedback-bubble">
          <span className="feedback-bubble-text">{t('feedback')}</span>
        </div>
      </div>
    </button>
  );
};

export default FeedbackButton;