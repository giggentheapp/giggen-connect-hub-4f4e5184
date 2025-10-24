import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const FileBank = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard?section=filbank');
  }, [navigate]);

  return null;
};

export default FileBank;
