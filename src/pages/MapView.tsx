import { Link } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Map from '@/components/Map';

const MapView = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til oversikt
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <MapIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Makere på kart</h1>
        </div>
      </div>

      {/* Map */}
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <Map />
      </div>

      {/* Info */}
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Kartet viser kun makere som har aktivert "Vis meg på kart" i sine profilinnstillinger.</p>
      </div>
    </div>
  );
};

export default MapView;