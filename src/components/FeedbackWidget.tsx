import { MessageCircle } from "lucide-react";

const FeedbackWidget = () => {
  return (
    <button
      data-tally-open="nr7Bq5"
      data-tally-emoji-text="👋"
      data-tally-emoji-animation="wave"
      className="fixed bottom-6 right-6 bg-primary hover:bg-primary-dark text-primary-foreground p-4 rounded-full shadow-primary hover:shadow-glow transition-all duration-300 hover:scale-110 z-50 group animate-float"
      aria-label="Send feedback"
    >
      <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
    </button>
  );
};

export default FeedbackWidget;