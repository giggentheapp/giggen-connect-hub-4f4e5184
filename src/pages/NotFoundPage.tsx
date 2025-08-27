import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Oops! Siden finnes ikke
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 underline transition-colors"
        >
          <Home className="h-4 w-4" />
          Gå til forsiden
        </Link>
      </div>
    </div>
  );
}