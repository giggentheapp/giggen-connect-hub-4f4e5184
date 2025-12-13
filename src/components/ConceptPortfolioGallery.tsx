import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UniversalGallery, GalleryFile } from './UniversalGallery';

interface ConceptPortfolioGalleryProps {
  conceptId: string;
}

export const ConceptPortfolioGallery = ({ conceptId }: ConceptPortfolioGalleryProps) => {
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data, error } = await supabase
          .from('concept_files')
          .select('id, filename, file_path, file_url, file_type, mime_type, title, thumbnail_path, created_at')
          .eq('concept_id', conceptId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFiles(data || []);
      } catch (error) {
        console.error('Error fetching concept files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [conceptId]);

  if (!loading && !files.length) {
    return null;
  }

  return (
    <UniversalGallery
      files={files}
      loading={loading}
      gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      gap="gap-3 md:gap-4"
      showEmptyMessage={false}
    />
  );
};

export default ConceptPortfolioGallery;
