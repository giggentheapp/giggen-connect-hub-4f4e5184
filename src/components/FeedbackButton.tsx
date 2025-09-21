import { MessageCircle } from "lucide-react";

const FeedbackButton = () => {
  return (
    <button 
      data-tally-open="nr7Bq5" 
      data-tally-emoji-text="👋" 
      data-tally-emoji-animation="wave"
      className="floating-feedback-btn"
      title="Send tilbakemelding"
      aria-label="Send feedback"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
};

export default FeedbackButton;