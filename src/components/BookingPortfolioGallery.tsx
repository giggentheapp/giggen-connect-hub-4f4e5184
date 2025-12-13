import React from 'react';
import { UniversalGallery, GalleryFile } from './UniversalGallery';
import { supabase } from '@/integrations/supabase/client';

interface BookingPortfolioGalleryProps {
  portfolioAttachments: any[];
}

export const BookingPortfolioGallery = ({ portfolioAttachments }: BookingPortfolioGalleryProps) => {
  if (!portfolioAttachments.length) {
    return null;
  }

  // Convert portfolio attachments to GalleryFile format
  const files: GalleryFile[] = portfolioAttachments
    .map((attachment) => {
      const file = attachment.portfolio_file;
      if (!file) return null;
      
      // Build file_url if not present
      let fileUrl = file.file_url;
      if (!fileUrl && file.file_path) {
        fileUrl = supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl;
      }
      
      return {
        id: file.id || attachment.id,
        filename: file.filename,
        file_path: file.file_path,
        file_url: fileUrl,
        file_type: file.file_type,
        mime_type: file.mime_type,
        title: file.title,
        thumbnail_path: file.thumbnail_path,
      } as GalleryFile;
    })
    .filter((file): file is GalleryFile => file !== null);

  return (
    <UniversalGallery
      files={files}
      gridCols="grid-cols-3"
      gap="gap-1"
      showEmptyMessage={false}
    />
  );
};

export default BookingPortfolioGallery;
