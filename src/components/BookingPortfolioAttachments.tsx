import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Image, Video, Music, File } from 'lucide-react';
import { useBookingPortfolio } from '@/hooks/useBookingPortfolio';
import { VideoPlayer } from '@/components/VideoPlayer';
import { supabase } from '@/integrations/supabase/client';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';

interface BookingPortfolioAttachmentsProps {
  bookingId: string;
  currentUserId: string;
  canEdit: boolean;
}

export const BookingPortfolioAttachments = ({
  bookingId,
  currentUserId,
  canEdit,
}: BookingPortfolioAttachmentsProps) => {
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

      let portfolioFileId = file.id;

      // Hvis filen ikke er i porteføljen, legg den til først
      if (!existingUsage) {
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
          })
          .select()
          .single();

        if (portfolioError) throw portfolioError;

        // Registrer at filen er i bruk i porteføljen
        await supabase.from('file_usage').insert({
          file_id: file.id,
          usage_type: 'profile_portfolio',
          reference_id: portfolioEntry.id,
        });

        portfolioFileId = portfolioEntry.id;
      } else {
        // Finn portfolio_file_id fra file_usage
        portfolioFileId = existingUsage.reference_id;
      }

      // Nå kan vi legge ved porteføljefilen til bookingen
      await attachPortfolioFile(portfolioFileId);
      setIsFilebankOpen(false);
    } catch (error: any) {
      console.error('Error adding file from filbank:', error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (fileType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const renderFilePreview = (file: any) => {
    const publicUrl = file.file_url || getPublicUrl(file.file_path);
    
    if (file.mime_type?.startsWith('video/')) {
      return (
        <VideoPlayer
          publicUrl={publicUrl}
          filename={file.title || file.filename}
          mimeType={file.mime_type}
        />
      );
    }
    
    if (file.mime_type?.startsWith('audio/')) {
      return (
        <div className="w-full h-32 rounded bg-muted flex flex-col items-center justify-center gap-2 p-3">
          <Music className="h-8 w-8 text-primary" />
          <audio
            controls
            className="w-full"
            preload="metadata"
          >
            <source src={publicUrl} type={file.mime_type} />
            Nettleseren din støtter ikke lydavspilling.
          </audio>
        </div>
      );
    }
    
    if (file.mime_type?.startsWith('image/')) {
      return (
        <img
          src={publicUrl}
          alt={file.title || file.filename}
          className="w-full h-32 rounded object-cover"
        />
      );
    }
    
    return (
      <div className="w-full h-32 rounded bg-muted flex items-center justify-center">
        {getFileIcon(file.mime_type || '')}
      </div>
    );
  };


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
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => setIsFilebankOpen(true)}>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {attachments.map((attachment) => (
                <Card key={attachment.id} className="relative group">
                  <CardContent className="p-3 space-y-2">
                    {renderFilePreview(attachment.portfolio_file)}
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate">
                        {attachment.portfolio_file.title || attachment.portfolio_file.filename}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {attachment.portfolio_file.file_type}
                      </Badge>
                    </div>
                    {canEdit && attachment.attached_by === currentUserId && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
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
