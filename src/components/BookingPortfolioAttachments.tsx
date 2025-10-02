import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, Image, Video, Music, File, Eye } from 'lucide-react';
import { useBookingPortfolio } from '@/hooks/useBookingPortfolio';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VideoPlayer } from '@/components/VideoPlayer';
import { supabase } from '@/integrations/supabase/client';

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
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  
  const { attachments, loading, attachPortfolioFile, removeAttachment } = useBookingPortfolio(bookingId);
  const { files: userPortfolioFiles, loading: portfolioLoading } = useProfilePortfolio(currentUserId);

  console.log('📂 BookingPortfolioAttachments rendering:', {
    bookingId,
    currentUserId,
    canEdit,
    attachmentsCount: attachments.length,
    userPortfolioFilesCount: userPortfolioFiles.length,
    loading,
    portfolioLoading
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (fileType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('portfolio').getPublicUrl(filePath);
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

  const availableFiles = userPortfolioFiles.filter(
    (file) => file.is_public && !attachments.some((att) => att.portfolio_file_id === file.id)
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portefølje</CardTitle>
              <CardDescription>
                Legg ved filer fra din portefølje som vil vises når arrangementet publiseres
              </CardDescription>
            </div>
            {canEdit && (
              <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Legg ved
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Velg fra din portefølje</DialogTitle>
                  </DialogHeader>
                  {portfolioLoading ? (
                    <div className="h-[60vh] flex items-center justify-center">
                      <p className="text-muted-foreground">Laster portefølje...</p>
                    </div>
                  ) : availableFiles.length === 0 ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                      <p className="text-muted-foreground text-center">
                        {userPortfolioFiles.length === 0 
                          ? "Du har ingen porteføljeefiler ennå. Gå til Din Profil for å laste opp filer."
                          : "Alle dine porteføljeefiler er allerede lagt ved denne bookingen."}
                      </p>
                      {userPortfolioFiles.length === 0 && (
                        <Button variant="outline" onClick={() => {
                          window.location.href = '/dashboard?section=files';
                        }}>
                          Gå til Din Profil
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {availableFiles.map((file) => (
                          <Card
                            key={file.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={async () => {
                              await attachPortfolioFile(file.id);
                              setIsSelectDialogOpen(false);
                            }}
                          >
                            <CardContent className="p-3 space-y-2">
                              {renderFilePreview(file)}
                              <div className="space-y-1">
                                <p className="text-sm font-medium truncate">
                                  {file.title || file.filename}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {file.file_type}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </DialogContent>
              </Dialog>
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

      {/* Preview Dialog */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewFile.title || previewFile.filename}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {renderFilePreview(previewFile)}
              {previewFile.description && (
                <p className="text-sm text-muted-foreground">{previewFile.description}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
