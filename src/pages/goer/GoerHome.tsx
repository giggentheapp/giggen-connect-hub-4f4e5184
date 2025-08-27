import { Link } from "react-router-dom";
import { MapPin, Calendar, Users } from "lucide-react";

export default function GoerHome() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Velkommen til Goer Dashboard</h2>
        <p className="text-muted-foreground">
          Utforsk arrangementer og finn makers i ditt område
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          to="/events-market"
          className="bg-card p-6 rounded-lg border hover:border-primary transition-colors"
        >
          <Calendar className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-2">Arrangementmarked</h3>
          <p className="text-sm text-muted-foreground">
            Se alle publiserte arrangementer
          </p>
        </Link>
        
        <Link 
          to="/goer/map"
          className="bg-card p-6 rounded-lg border hover:border-primary transition-colors"
        >
          <MapPin className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-2">Kart</h3>
          <p className="text-sm text-muted-foreground">
            Utforsk arrangementer på kartet
          </p>
        </Link>
        
        <Link 
          to="/bookings"
          className="bg-card p-6 rounded-lg border hover:border-primary transition-colors"
        >
          <Users className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-2">Mine Bookinger</h3>
          <p className="text-sm text-muted-foreground">
            Se dine bookingforespørsler
          </p>
        </Link>
      </div>
    </div>
  );
}