import { useNavigate } from 'react-router-dom';
import LeafletFullscreenMap from '@/components/LeafletFullscreenMap';

const GoerMapPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleMakerClick = (makerId: string) => {
    navigate(`/profile/${makerId}`);
  };

  return (
    <LeafletFullscreenMap 
      onBack={handleBack}
      onMakerClick={handleMakerClick}
    />
  );
};

export default GoerMapPage;