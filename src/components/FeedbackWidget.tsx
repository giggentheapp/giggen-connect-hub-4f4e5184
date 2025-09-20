const FeedbackWidget = () => {
  const handleClick = () => {
    // Fallback in case Tally script hasn't loaded yet
    if ((window as any).Tally) {
      (window as any).Tally.openPopup('nr7Bq5');
    }
  };

  return (
    <button
      type="button"
      data-tally-open="nr7Bq5" 
      data-tally-emoji-text="💬" 
      data-tally-emoji-animation="wave"
      onClick={handleClick}
      className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-50"
      style={{ 
        bottom: 'max(24px, env(safe-area-inset-bottom))'
      }}
    >
      💬 Tilbakemelding
    </button>
  );
};

export default FeedbackWidget;