import React from 'react';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UniversalGallery, GalleryFile } from './UniversalGallery';

interface ProfilePortfolioViewerProps {
  userId: string;
  showControls?: boolean;
  isOwnProfile?: boolean;
}

export const ProfilePortfolioViewer = ({ userId, showControls = false, isOwnProfile = false }: ProfilePortfolioViewerProps) => {
  const { data: rawFiles = [], isLoading: loading, error } = useProfilePortfolio(userId);
  const { t } = useAppTranslation();

  // Convert to GalleryFile format - file_path is used to build URL
  const files: GalleryFile[] = rawFiles.map((file) => ({
    id: file.id,
    filename: file.filename,
    file_path: file.file_path,
    file_url: file.file_url,
    file_type: file.file_type,
    mime_type: file.mime_type,
    title: file.title,
    thumbnail_path: file.thumbnail_path,
  }));

  const emptyMessage = showControls || isOwnProfile
    ? t('noPortfolioUploaded')
    : "Ingen offentlige porteføljefiler tilgjengelig";

  return (
    <UniversalGallery
      files={files}
      loading={loading}
      error={error as Error | null}
      emptyMessage={emptyMessage}
      gridCols="grid-cols-3"
      gap="gap-1"
      showEmptyMessage={true}
    />
  );
};

export default ProfilePortfolioViewer;
