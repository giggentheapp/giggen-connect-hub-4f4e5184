const FeedbackWidget = () => {
  return (
    <div className="fixed right-0 top-0 h-full w-16 bg-primary flex flex-col items-center justify-center z-30 shadow-lg">
      <button
        data-tally-open="nr7Bq5" 
        data-tally-emoji-text="💬" 
        data-tally-emoji-animation="wave"
        className="bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-l-lg transition-all duration-200 hover:scale-105 writing-mode-vertical"
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg">💬</span>
          <span className="text-xs font-medium transform rotate-90 whitespace-nowrap origin-center">
            Tilbakemelding
          </span>
        </div>
      </button>
    </div>
  );
};

export default FeedbackWidget;