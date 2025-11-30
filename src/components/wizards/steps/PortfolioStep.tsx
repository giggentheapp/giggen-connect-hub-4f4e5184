import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Image, Video, Music, File as FileIcon } from 'lucide-react';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';
import { WizardStepProps } from '../BaseConceptWizard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * PortfolioStep - Common portfolio file selection
 * Uses FilebankSelectionModal for file management
 */
export const PortfolioStep = ({ data, updateData, userId }: WizardStepProps) => {
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const { toast } = useToast();

  const handleFileSelected = (file: any) => {
    const publicUrl = `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/${file.file_path}`;

    const portfolioFiles = data.portfolio_files || [];
    updateData('portfolio_files', [
      ...portfolioFiles,
      {
        filebankId: file.id,
        filename: file.filename,
        file_path: file.file_path,
        file_type: file.file_type,
        mime_type: file.mime_type,
        file_size: file.file_size,
        publicUrl: publicUrl,
        file_url: publicUrl,
        title: file.filename,
        thumbnail_path: file.thumbnail_path,
        uploadedAt: file.created_at,
        fromFilbank: true,
      },
    ]);

    toast({
      title: 'Fil lagt til',
      description: `${file.filename} er lagt til i portfolio`,
    });
  };

  const removePortfolioFile = async (fileData: any) => {
    // If file has a conceptFileId, delete it from the database
    if (fileData.conceptFileId) {
      try {
        const { error } = await supabase
          .from('concept_files')
          .delete()
          .eq('id', fileData.conceptFileId);

        if (error) {
          toast({
            title: 'Feil ved sletting',
            description: `Kunne ikke slette filen: ${error.message}`,
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Fil fjernet',
          description: 'Filen er fjernet fra portfolio og databasen',
        });
      } catch (error) {
        toast({
          title: 'Feil ved sletting',
          description: 'Kunne ikke slette filen',
          variant: 'destructive',
        });
        return;
      }
    } else {
      toast({
        title: 'Fil fjernet',
        description: 'Filen er fjernet fra portfolio',
      });
    }

    const portfolioFiles = data.portfolio_files || [];
    updateData(
      'portfolio_files',
      portfolioFiles.filter(
        (file: any) =>
          file.filebankId !== fileData.filebankId &&
          file.conceptFileId !== fileData.conceptFileId
      )
    );
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image'))
      return <Image className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('video'))
      return <Video className="h-4 w-4 text-red-500" />;
    if (fileType.includes('audio'))
      return <Music className="h-4 w-4 text-green-500" />;
    return <FileIcon className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const portfolioFiles = data.portfolio_files || [];

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Last opp bilder, videoer eller annet materiale som viser ditt arbeid
          </p>
          <Button onClick={() => setShowFilebankModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Velg fra Filbank
          </Button>
        </div>

        {portfolioFiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolioFiles.map((file: any, index: number) => (
              <Card key={file.filebankId || file.conceptFileId || index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getFileIcon(file.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePortfolioFile(file)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {portfolioFiles.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Ingen filer valgt ennå. Klikk "Velg fra Filbank" for å legge til.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <FilebankSelectionModal
        isOpen={showFilebankModal}
        onClose={() => setShowFilebankModal(false)}
        onSelect={(file) => file && handleFileSelected(file)}
        userId={userId}
        category="portfolio"
      />
    </>
  );
};
