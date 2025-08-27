import { useNavigate } from 'react-router-dom';
import GoerFullscreenMap from '@/components/GoerFullscreenMap';

const GoerMapPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleMakerClick = (makerId: string) => {
    navigate(`/profile/${makerId}`);
  };

  return (
    <GoerFullscreenMap 
      onBack={handleBack}
      onMakerClick={handleMakerClick}
    />
  );
};

export default GoerMapPage;