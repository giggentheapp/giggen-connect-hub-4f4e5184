import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Map from '@/components/Map';

const MapView = () => {
  const [forceRefresh, setForceRefresh] = useState(0);
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
        
        {/* Force Refresh Button */}
        <Button
          variant="outline"
          onClick={() => setForceRefresh(prev => prev + 1)}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Oppdater kart
        </Button>
      </div>

      {/* Map */}
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <Map forceRefresh={forceRefresh} />
      </div>

      {/* Info */}
      <div className="mt-4 text-sm text-muted-foreground space-y-2">
        <p>Kartet viser kun makere som har aktivert "Vis meg på kart" i sine profilinnstillinger.</p>
        <p>Debug-informasjonen under kartet viser detaljert status og feilsøkingsinformasjon.</p>
      </div>
    </div>
  );
};

export default MapView;