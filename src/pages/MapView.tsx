import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Map from '@/components/Map';

const MapView = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Simple navigation dropdown */}
      <div className="absolute top-4 left-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-card/95 backdrop-blur-sm shadow-lg">
              <Menu className="h-4 w-4 mr-2" />
              Meny
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-card/95 backdrop-blur-sm">
            <DropdownMenuItem asChild>
              <Link to="/dashboard">
                Dashboard
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Fullscreen Map */}
      <Map className="absolute inset-0" />
    </div>
  );
};

export default MapView;