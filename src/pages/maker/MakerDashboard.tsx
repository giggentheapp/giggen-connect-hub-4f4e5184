import { Link, Routes, Route } from "react-router-dom";
import MakerHome from "./MakerHome";

export default function MakerDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">GIGGEN - Maker</h1>
            <div className="flex items-center gap-4">
              <Link 
                to="/maker" 
                className="text-sm hover:text-primary transition-colors"
              >
                Hjem
              </Link>
              <Link 
                to="/bookings" 
                className="text-sm hover:text-primary transition-colors"
              >
                Bookings
              </Link>
              <Link 
                to="/events-market" 
                className="text-sm hover:text-primary transition-colors"
              >
                Arrangementer
              </Link>
              <Link 
                to="/goer" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Bytt til Goer
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<MakerHome />} />
        </Routes>
      </main>
    </div>
  );
}