import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Image, Video, Music, File as FileIcon, Check } from 'lucide-react';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';
import { WizardStepProps } from '../BaseConceptWizard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserFiles } from '@/hooks/useUserFiles';
import { useNavigate } from 'react-router-dom';

/**
 * PortfolioStep - Common portfolio file selection
 * Shows files from filbank directly and allows selection
 */
export const PortfolioStep = React.memo(({ data, updateData, userId }: WizardStepProps) => {
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch files from filbank
  const { files: filbankFiles, loading: loadingFiles } = useUserFiles(userId);
  
  // Filter portfolio files from filbank (images, videos, audio)
  const availableFiles = useMemo(() => {
    if (!filbankFiles) return [];
    return filbankFiles.filter(file => 
      ['image', 'video', 'audio'].includes(file.file_type) ||
      file.mime_type?.startsWith('image/') ||
      file.mime_type?.startsWith('video/') ||
      file.mime_type?.startsWith('audio/')
    );
  }, [filbankFiles]);

  const handleFileSelected = useCallback((file: any) => {
    const publicUrl = `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/${file.file_path}`;

    const portfolioFiles = data.portfolio_files || [];
    
    // Check if file is already selected
    const isAlreadySelected = portfolioFiles.some(
      (pf: any) => pf.filebankId === file.id || pf.file_path === file.file_path
    );
    
    if (isAlreadySelected) {
      toast({
        title: 'Fil allerede valgt',
        description: `${file.filename} er allerede i porteføljen`,
        variant: 'default',
      });
      return;
    }

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
  }, [data.portfolio_files, updateData, toast]);

  const removePortfolioFile = useCallback(async (fileData: any) => {
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
  }, [data.portfolio_files, updateData, toast]);

  const getFileIcon = useCallback((fileType: string) => {
    if (fileType?.includes('image'))
      return <Image className="h-4 w-4 text-blue-500" />;
    if (fileType?.includes('video'))
      return <Video className="h-4 w-4 text-red-500" />;
    if (fileType?.includes('audio'))
      return <Music className="h-4 w-4 text-green-500" />;
    return <FileIcon className="h-4 w-4 text-muted-foreground" />;
  }, []);

  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  }, []);

  const getPublicUrl = useCallback((filePath: string) => {
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data.publicUrl;
  }, []);

  const portfolioFiles = data.portfolio_files || [];
  const selectedFileIds = useMemo(() => 
    new Set(portfolioFiles.map((f: any) => f.filebankId).filter(Boolean)),
    [portfolioFiles]
  );

  const handleNavigateToFilbank = useCallback(() => {
    if (userId) {
      navigate(`/profile/${userId}?section=filbank`);
    }
  }, [userId, navigate]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Velg filer fra filbanken eller last opp nye filer
          </p>
          <Button onClick={() => setShowFilebankModal(true)} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Last opp nye filer
          </Button>
        </div>

        {/* Show selected portfolio files */}
        {portfolioFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Valgte filer ({portfolioFiles.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioFiles.map((file: any, index: number) => (
                <Card key={file.filebankId || file.conceptFileId || index} className="border-primary">
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
          </div>
        )}

        {/* Show available files from filbank */}
        {loadingFiles ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : availableFiles.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Filer i filbanken ({availableFiles.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableFiles.map((file) => {
                const isSelected = selectedFileIds.has(file.id);
                const publicUrl = getPublicUrl(file.file_path);
                const thumbnailUrl = file.thumbnail_path ? getPublicUrl(file.thumbnail_path) : null;
                
                return (
                  <Card
                    key={file.id}
                    className={`cursor-pointer hover:border-primary transition-all ${
                      isSelected ? 'border-primary ring-2 ring-primary' : ''
                    }`}
                    onClick={() => !isSelected && handleFileSelected(file)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="relative">
                        {file.file_type === 'image' || file.mime_type?.startsWith('image/') ? (
                          <img
                            src={publicUrl}
                            alt={file.filename}
                            className="w-full h-24 object-cover rounded"
                          />
                        ) : thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={file.filename}
                            className="w-full h-24 object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-24 bg-muted rounded flex items-center justify-center">
                            {getFileIcon(file.file_type)}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium truncate" title={file.filename}>
                        {file.filename}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          // Only show CTA when filbank is actually empty
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Ingen filer i filbanken. Last opp filer for å velge dem her.
              </p>
              <Button onClick={handleNavigateToFilbank}>
                <Plus className="h-4 w-4 mr-2" />
                Gå til Filbank
              </Button>
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
});
