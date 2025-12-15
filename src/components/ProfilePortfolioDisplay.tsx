import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { UniversalGallery, GalleryFile } from './UniversalGallery';

interface ProfilePortfolioDisplayProps {
  userId: string;
}

export const ProfilePortfolioDisplay = ({ userId }: ProfilePortfolioDisplayProps) => {
  // Use React Query hook for data fetching
  const { data: portfolioFiles = [], isLoading: loading, error } = useProfilePortfolio(userId);
  
  // Filter and transform files with public URLs
  const files: GalleryFile[] = useMemo(() => {
    return portfolioFiles
      .filter(file => ['image', 'video', 'audio'].includes(file.file_type))
      .map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('filbank')
          .getPublicUrl(file.file_path);
        
        return {
          id: file.id,
          filename: file.filename,
          file_path: file.file_path,
          file_url: publicUrl,
          file_type: file.file_type,
          mime_type: file.mime_type,
          title: file.title,
          thumbnail_path: file.thumbnail_path
        };
      });
  }, [portfolioFiles]);

  if (files.length === 0 && !loading) {
    return null;
  }

  return (
    <UniversalGallery
      files={files}
      loading={loading}
      error={error || null}
      gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      gap="gap-3 md:gap-4"
      showEmptyMessage={false}
    />
  );
};
