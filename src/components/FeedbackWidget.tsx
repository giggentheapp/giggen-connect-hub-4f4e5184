// Fresh, working Tally feedback integration
const FeedbackWidget = () => {
  return (
    <button
      data-tally-open="nr7Bq5" 
      data-tally-emoji-text="👋" 
      data-tally-emoji-animation="wave"
      className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-50 feedback-button"
      style={{ 
        bottom: 'max(24px, env(safe-area-inset-bottom))'
      }}
    >
      💬 Tilbakemelding
    </button>
  );
};

export default FeedbackWidget;