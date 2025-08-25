import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HospitalityRiderFile {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

export const useHospitalityRiders = (userId: string | undefined) => {
  const [files, setFiles] = useState<HospitalityRiderFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHospitalityRiders = async () => {
    if (!userId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('hospitality_riders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setFiles(data || []);
    } catch (err: any) {
      console.error('Error fetching hospitality riders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalityRiders();
  }, [userId]);

  return { files, loading, error, refetch: fetchHospitalityRiders };
};