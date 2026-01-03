import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useBookingPortfolio } from '@/hooks/useBookingPortfolio';
import { supabase } from '@/integrations/supabase/client';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';
import { UniversalGallery, GalleryFile } from '@/components/UniversalGallery';

interface BookingPortfolioAttachmentsProps {
  bookingId: string;
  currentUserId: string;
  canEdit: boolean;
  bookingStatus?: string;
}

// Extended type for gallery files with attachment metadata
interface AttachmentGalleryFile extends GalleryFile {
  _attachmentId: string;
  _attachedBy: string;
}

export const BookingPortfolioAttachments = ({
  bookingId,
  currentUserId,
  canEdit,
  bookingStatus,
}: BookingPortfolioAttachmentsProps) => {
  // Portfolio attachments can be edited in allowed, approved_by_sender, approved_by_receiver, and approved_by_both
  const canEditAttachments = canEdit || bookingStatus === 'approved_by_both';
  const [isFilebankOpen, setIsFilebankOpen] = useState(false);
  
  const { attachments, loading, attachPortfolioFile, removeAttachment } = useBookingPortfolio(bookingId);

  const handleFilebankSelect = async (file: any) => {
    console.log('📎 Selected file from filbank:', file);
    
    try {
      // Sjekk om filen allerede er i porteføljen
      const { data: existingUsage } = await supabase
        .from('file_usage')
        .select('*')
        .eq('file_id', file.id)
        .eq('usage_type', 'profile_portfolio')
        .maybeSingle();

      let portfolioFileId: string | null = null;

      // Hvis filen har en eksisterende usage entry, verifiser at portfolio-filen eksisterer
      if (existingUsage?.reference_id) {
        // Verifiser at portfolio-filen eksisterer og tilhører brukeren
        const { data: portfolioFile, error: portfolioCheckError } = await supabase
          .from('profile_portfolio')
          .select('id, user_id')
          .eq('id', existingUsage.reference_id)
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (!portfolioCheckError && portfolioFile) {
          // Portfolio-filen eksisterer og tilhører brukeren
          portfolioFileId = portfolioFile.id;
        }
        // Hvis portfolio-filen ikke eksisterer eller ikke tilhører brukeren,
        // vil vi opprette en ny nedenfor
      }

      // Hvis vi ikke har en gyldig portfolioFileId, opprett en ny portfolio entry
      if (!portfolioFileId) {
        const { data: portfolioEntry, error: portfolioError } = await supabase
          .from('profile_portfolio')
          .insert({
            user_id: currentUserId,
            filename: file.filename,
            file_path: file.file_path,
            file_type: file.file_type || 'document',
            mime_type: file.mime_type,
            file_size: file.file_size,
            is_public: false, // Default til privat for booking-vedlegg
            title: file.filename,
            thumbnail_path: file.thumbnail_path || null,
          })
          .select()
          .single();

        if (portfolioError) throw portfolioError;

        // Oppdater eller opprett file_usage entry
        if (existingUsage) {
          // Oppdater eksisterende entry med riktig reference_id
          const { error: updateError } = await supabase
            .from('file_usage')
            .update({ reference_id: portfolioEntry.id })
            .eq('id', existingUsage.id);

          if (updateError) {
            console.warn('Failed to update file_usage, but continuing:', updateError);
          }
        } else {
          // Opprett ny file_usage entry
          const { error: insertError } = await supabase
            .from('file_usage')
            .insert({
              file_id: file.id,
              usage_type: 'profile_portfolio',
              reference_id: portfolioEntry.id,
            });

          if (insertError) {
            console.warn('Failed to insert file_usage, but continuing:', insertError);
          }
        }

        portfolioFileId = portfolioEntry.id;
      }

      if (!portfolioFileId) {
        throw new Error('Kunne ikke opprette eller finne portfolio-fil');
      }

      // Nå kan vi legge ved porteføljefilen til bookingen
      await attachPortfolioFile(portfolioFileId);
      setIsFilebankOpen(false);
    } catch (error: any) {
      console.error('Error adding file from filbank:', error);
    }
  };

  // Convert attachments to GalleryFile format
  const galleryFiles: AttachmentGalleryFile[] = attachments
    .map((attachment) => {
      if (!attachment.portfolio_file) return null;
      
      const file = attachment.portfolio_file;
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
        title: file.title || file.filename,
        thumbnail_path: file.thumbnail_path || null,
        // Store attachment info for removal
        _attachmentId: attachment.id,
        _attachedBy: attachment.attached_by,
      } as AttachmentGalleryFile;
    })
    .filter((file): file is AttachmentGalleryFile => file !== null);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portefølje for publisert arrangement</CardTitle>
              <CardDescription>
                Legg ved filer fra filbanken som vil vises når arrangementet publiseres. 
                {attachments.length > 0 && ` (${attachments.length} ${attachments.length === 1 ? 'fil' : 'filer'} valgt)`}
              </CardDescription>
            </div>
            {canEditAttachments && (
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={() => setIsFilebankOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Legg ved fra filbank
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laster...</p>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen porteføljeefiler lagt ved ennå
            </p>
          ) : (
            <div className="space-y-4">
              <UniversalGallery
                files={galleryFiles}
                gridCols="grid-cols-2 md:grid-cols-3"
                gap="gap-4"
                showEmptyMessage={false}
                showFilename={true}
              />
              {/* Remove buttons for files the user attached */}
              {canEditAttachments && (
                <div className="flex flex-wrap gap-2">
                  {galleryFiles
                    .filter((file) => file._attachedBy === currentUserId)
                    .map((file) => (
                      <Button
                        key={file._attachmentId}
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeAttachment(file._attachmentId)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Fjern {file.title || file.filename}
                      </Button>
                    ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filbank Selection Modal */}
      <FilebankSelectionModal
        isOpen={isFilebankOpen}
        onClose={() => setIsFilebankOpen(false)}
        onSelect={handleFilebankSelect}
        userId={currentUserId}
        fileTypes={['image', 'video', 'audio', 'document']}
        title="Velg filer fra filbanken"
        description="Velg filer som skal vises når arrangementet publiseres"
      />
    </>
  );
};