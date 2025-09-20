const FeedbackWidget = () => {
  const handleClick = () => {
    console.log('Feedback button clicked');
    console.log('Tally object available:', !!(window as any).Tally);
    
    // Check if Tally script loaded
    if (!(window as any).Tally) {
      console.error('Tally script not loaded');
      // Fallback: open form in new tab
      window.open('https://tally.so/r/nr7Bq5', '_blank');
      return;
    }
    
    try {
      console.log('Opening Tally popup...');
      (window as any).Tally.openPopup('nr7Bq5');
    } catch (error) {
      console.error('Error opening Tally popup:', error);
      // Fallback: open form in new tab
      window.open('https://tally.so/r/nr7Bq5', '_blank');
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