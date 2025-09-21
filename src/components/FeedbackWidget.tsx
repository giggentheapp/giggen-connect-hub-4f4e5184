import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const FeedbackWidget = () => {
  return (
    <Button
      data-tally-open="nr7Bq5"
      data-tally-emoji-text="👋"
      data-tally-emoji-animation="wave"
      className="fixed bottom-6 right-6 p-4 rounded-full shadow-primary hover:shadow-glow transition-all duration-300 hover:scale-110 z-50 group animate-float"
      size="icon"
      aria-label="Send feedback"
    >
      <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
    </Button>
  );
};

export default FeedbackWidget;