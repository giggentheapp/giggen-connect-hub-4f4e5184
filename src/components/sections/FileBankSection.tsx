import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserFiles, FileWithUsage } from '@/hooks/useUserFiles';
import { Search, Trash2, Upload, Image, FileText, Video, Music, Download, Copy, Eye, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileUploadModal } from '@/components/FileUploadModal';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types/auth';

interface FileBankSectionProps {
  profile: UserProfile;
}

export const FileBankSection = ({ profile }: FileBankSectionProps) => {
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileWithUsage | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const { toast } = useToast();

  const { files, loading, deleteFile, refetch } = useUserFiles(profile.user_id);

  const getFileIcon = (fileType: string) => {
    if (fileType === 'image') return Image;
    if (fileType === 'video') return Video;
    if (fileType === 'audio') return Music;
    return FileText;
  };

  const getUsageLabel = (usageType: string) => {
    const labels: Record<string, string> = {
      'profile_portfolio': 'Profilportefølje',
      'tech_spec': 'Tech Spec',
      'hospitality_rider': 'Hospitality Rider',
      'band_portfolio': 'Bandportefølje',
      'band_tech_spec': 'Band Tech Spec',
      'band_hospitality': 'Band Hospitality',
    };
    return labels[usageType] || usageType;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'image': 'Bilder',
      'video': 'Videoer',
      'audio': 'Lydfiler',
      'tech_spec': 'Tech Specs',
      'hospitality_rider': 'Hospitality Riders',
      'document': 'Dokumenter',
    };
    return labels[category] || 'Annet';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      default: return FileText;
    }
  };

  const copyFileUrl = (url: string | null) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Lenke kopiert',
      description: 'Fillenken er kopiert til utklippstavlen',
    });
  };

  const downloadFile = (url: string | null, filename: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const handleDelete = async () => {
    if (!selectedFile) return;

    try {
      await deleteFile(selectedFile.id, selectedFile.file_path);
      toast({
        title: 'Fil slettet',
        description: 'Filen er permanent slettet fra filbanken',
      });
      setDeleteDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: 'Feil ved sletting',
        description: 'Kunne ikke slette filen',
        variant: 'destructive',
      });
    }
  };

  const togglePortfolioUsage = async (file: FileWithUsage, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isInPortfolio = file.usage.some(u => u.usage_type === 'profile_portfolio');
    
    try {
      if (isInPortfolio) {
        // Remove from portfolio
        const usageId = file.usage.find(u => u.usage_type === 'profile_portfolio')?.id;
        if (usageId) {
          const { error } = await supabase
            .from('file_usage')
            .delete()
            .eq('id', usageId);
          
          if (error) throw error;
          
          toast({
            title: 'Fjernet fra portefølje',
            description: 'Filen vises ikke lenger i porteføljen din',
          });
        }
      } else {
        // Add to portfolio
        const { error } = await supabase
          .from('file_usage')
          .insert({
            file_id: file.id,
            usage_type: 'profile_portfolio',
            reference_id: profile.user_id
          });
        
        if (error) throw error;
        
        toast({
          title: 'Lagt til i portefølje',
          description: 'Filen vises nå i porteføljen din',
        });
      }
      
      refetch();
    } catch (error) {
      console.error('Error toggling portfolio:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke oppdatere portefølje',
        variant: 'destructive',
      });
    }
  };

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(search.toLowerCase())
  );

  const categorizedFiles = filteredFiles.reduce((acc, file) => {
    const category = (file as any).category || 'document';
    if (!acc[category]) acc[category] = [];
    acc[category].push(file);
    return acc;
  }, {} as Record<string, FileWithUsage[]>);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Ukjent';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col overflow-auto pb-24 md:pb-0">
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <p className="text-center text-muted-foreground py-8">Laster filer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-auto pb-24 md:pb-0">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Filbank</h1>
            <p className="text-muted-foreground">
              {files.length} filer totalt
            </p>
          </div>
          <Button onClick={() => setUploadModalOpen(true)} size="lg" className="mt-4 md:mt-0">
            <Upload className="mr-2 h-5 w-5" />
            Last opp fil
          </Button>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Søk etter filer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {!loading && filteredFiles.length === 0 && (
          <div className="text-center py-20">
            <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {search ? 'Ingen filer funnet' : 'Ingen filer ennå'}
            </p>
            <p className="text-muted-foreground mb-6">
              {search ? 'Prøv et annet søk' : 'Last opp din første fil for å komme i gang'}
            </p>
            {!search && (
              <Button onClick={() => setUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Last opp fil
              </Button>
            )}
          </div>
        )}

        {!loading && Object.keys(categorizedFiles).map((category) => (
          <div key={category} className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              {(() => {
                const Icon = getCategoryIcon(category);
                return <Icon className="h-5 w-5" />;
              })()}
              <h2 className="text-xl font-semibold">{getCategoryLabel(category)}</h2>
              <Badge variant="secondary">{categorizedFiles[category].length}</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {categorizedFiles[category].map((file) => {
                const isHovered = hoveredFile === file.id;
                const Icon = getFileIcon(file.file_type);
                
                return (
                  <div
                    key={file.id}
                    className="group relative aspect-square rounded-lg overflow-hidden border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredFile(file.id)}
                    onMouseLeave={() => setHoveredFile(null)}
                  >
                    {/* File preview/icon */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      {file.file_type === 'image' && file.file_url ? (
                        <img 
                          src={file.file_url} 
                          alt={file.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>

                    {/* Hover overlay with actions */}
                    {isHovered && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-3">
                        <div className="flex gap-2 mb-2">
                          {(file.file_type === 'image' || file.file_type === 'video' || file.file_type === 'audio') && (
                            <Button
                              size="icon"
                              variant={file.usage.some(u => u.usage_type === 'profile_portfolio') ? 'default' : 'secondary'}
                              className="h-8 w-8"
                              onClick={(e) => togglePortfolioUsage(file, e)}
                              title={file.usage.some(u => u.usage_type === 'profile_portfolio') ? 'Fjern fra portefølje' : 'Legg til i portefølje'}
                            >
                              {file.usage.some(u => u.usage_type === 'profile_portfolio') ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {file.file_url && (
                            <>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={() => copyFileUrl(file.file_url)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={() => downloadFile(file.file_url, file.filename)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedFile(file);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {file.usage.length > 0 && (
                          <div className="text-white text-xs text-center">
                            <div className="flex items-center gap-1 justify-center mb-1">
                              <Eye className="h-3 w-3" />
                              <span className="font-medium">Brukes i:</span>
                            </div>
                            {file.usage.map((usage) => (
                              <div key={usage.id} className="text-[10px] opacity-90">
                                {getUsageLabel(usage.usage_type)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* File info at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {file.filename}
                      </p>
                      <p className="text-white/70 text-[10px]">
                        {formatFileSize(file.file_size)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slett fil?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedFile?.usage && selectedFile.usage.length > 0 ? (
                  <>
                    Denne filen brukes i følgende seksjoner:
                    <ul className="list-disc list-inside mt-2">
                      {selectedFile.usage.map((usage) => (
                        <li key={usage.id}>{getUsageLabel(usage.usage_type)}</li>
                      ))}
                    </ul>
                    <p className="mt-2 font-semibold">
                      Hvis du sletter denne filen, vil den fjernes fra alle disse seksjonene.
                    </p>
                  </>
                ) : (
                  'Er du sikker på at du vil slette denne filen? Dette kan ikke angres.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Slett fil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <FileUploadModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUploadComplete={refetch}
          userId={profile.user_id}
        />
      </div>
    </div>
  );
};