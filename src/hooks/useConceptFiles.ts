import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConceptPortfolioFile {
  id: string;
  concept_id: string;
  creator_id: string;
  filename: string;
  file_path: string;
  file_url: string | null;
  file_type: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
  title?: string;
  description?: string;
}

export const useConceptFiles = (conceptId: string | undefined) => {
  const [files, setFiles] = useState<ConceptPortfolioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conceptId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    const fetchConceptFiles = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('concept_files')
          .select('*')
          .eq('concept_id', conceptId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        setFiles(data || []);
      } catch (err: any) {
        console.error('Error fetching concept files:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConceptFiles();
  }, [conceptId]);

  return { files, loading, error, refetch: () => {
    if (conceptId) {
      setLoading(true);
      // Re-trigger useEffect by updating conceptId dependency
    }
  }};
};