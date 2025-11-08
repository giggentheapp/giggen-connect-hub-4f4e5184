import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Root = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
    
    if (hasSeenOnboarding === 'true') {
      navigate('/auth');
    } else {
      navigate('/onboarding');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default Root;
