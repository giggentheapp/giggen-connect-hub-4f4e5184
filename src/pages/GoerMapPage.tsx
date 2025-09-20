import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ComingSoonMapSection from '@/components/ComingSoonMapSection';

const GoerMapPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="relative w-full h-screen">
      {/* Back button */}
      <Button
        variant="outline"
        onClick={handleBack}
        className="absolute top-4 left-4 z-10 bg-white shadow-md"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Tilbake
      </Button>
      
      {/* Coming Soon Map */}
      <div className="flex items-center justify-center h-full p-4">
        <ComingSoonMapSection />
      </div>
    </div>
  );
};

export default GoerMapPage;