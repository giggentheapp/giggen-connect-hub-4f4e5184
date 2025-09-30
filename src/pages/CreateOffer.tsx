import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConceptWizard } from '@/components/ConceptWizard';

const CreateOffer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editConceptId = searchParams.get('edit') || undefined;
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        navigate('/auth');
      }
    };
    fetchUserId();
  }, [navigate]);

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ConceptWizard
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        userId={userId}
        editConceptId={editConceptId}
      />
    </div>
  );
};

export default CreateOffer;
