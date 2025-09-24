import { useAppTranslation } from '../hooks/useAppTranslation';
import { useAppLanguage } from '../contexts/AppLanguageContext';

const FeedbackButton = () => {
  const { t } = useAppTranslation();
  const { language } = useAppLanguage();
  
  // Use different Tally form IDs based on language
  const tallyId = language === 'en' ? 'mOvdxY' : 'nr7Bq5';
  const flagEmoji = language === 'en' ? '🇬🇧' : '🇳🇴';
  
  return (
    <button 
      data-tally-open={tallyId}
      data-tally-emoji-text="👋" 
      data-tally-emoji-animation="wave"
      className="floating-feedback-btn"
      title={t('feedback')}
      aria-label={t('feedback')}
    >
      <span className="feedback-icon">💬</span>
      <span className="flag-icon">{flagEmoji}</span>
    </button>
  );
};

export default FeedbackButton;