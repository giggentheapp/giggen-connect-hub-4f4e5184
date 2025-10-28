import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserFiles, FileWithUsage } from '@/hooks/useUserFiles';
import { Search, Trash2, Upload, Image, FileText, Video, Music, Download, Copy, Eye, Plus, X, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AvatarCropModal } from '@/components/AvatarCropModal';
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
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageForCrop, setImageForCrop] = useState<string | null>(null);
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

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const addSelectedToPortfolio = async () => {
    if (selectedFiles.size === 0) return;

    try {
      const filesToAdd = files.filter(f => 
        selectedFiles.has(f.id) && 
        (f.file_type === 'image' || f.file_type === 'video' || f.file_type === 'audio') &&
        !f.usage.some(u => u.usage_type === 'profile_portfolio')
      );

      if (filesToAdd.length === 0) {
        toast({
          title: 'Ingen nye filer',
          description: 'Alle valgte filer er allerede i porteføljen',
        });
        return;
      }

      const { error } = await supabase
        .from('file_usage')
        .insert(
          filesToAdd.map(file => ({
            file_id: file.id,
            usage_type: 'profile_portfolio',
            reference_id: profile.user_id
          }))
        );

      if (error) throw error;

      toast({
        title: 'Lagt til i portefølje',
        description: `${filesToAdd.length} fil(er) lagt til i porteføljen`,
      });

      setSelectedFiles(new Set());
      refetch();
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke legge til filer i porteføljen',
        variant: 'destructive',
      });
    }
  };

  const removeSelectedFromPortfolio = async () => {
    if (selectedFiles.size === 0) return;

    try {
      const filesToRemove = files.filter(f => 
        selectedFiles.has(f.id) && 
        f.usage.some(u => u.usage_type === 'profile_portfolio')
      );

      if (filesToRemove.length === 0) {
        toast({
          title: 'Ingen filer',
          description: 'Ingen av de valgte filene er i porteføljen',
        });
        return;
      }

      const usageIds = filesToRemove
        .map(f => f.usage.find(u => u.usage_type === 'profile_portfolio')?.id)
        .filter(Boolean);

      const { error } = await supabase
        .from('file_usage')
        .delete()
        .in('id', usageIds);

      if (error) throw error;

      toast({
        title: 'Fjernet fra portefølje',
        description: `${filesToRemove.length} fil(er) fjernet fra porteføljen`,
      });

      setSelectedFiles(new Set());
      refetch();
    } catch (error) {
      console.error('Error removing from portfolio:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke fjerne filer fra porteføljen',
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
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Filbank</h1>
              <p className="text-muted-foreground">
                {files.length} filer totalt
                {selectedFiles.size > 0 && ` • ${selectedFiles.size} valgt`}
              </p>
            </div>
            <Button onClick={() => setUploadModalOpen(true)} size="lg" className="mt-4 md:mt-0">
              <Upload className="mr-2 h-5 w-5" />
              Last opp fil
            </Button>
          </div>

          {selectedFiles.size > 0 && (
            <div className="flex gap-2 items-center">
              <Button onClick={addSelectedToPortfolio} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Legg til i portefølje ({selectedFiles.size})
              </Button>
              <Button onClick={removeSelectedFromPortfolio} variant="outline" size="sm">
                <X className="mr-2 h-4 w-4" />
                Fjern fra portefølje
              </Button>
              <Button onClick={() => setSelectedFiles(new Set())} variant="ghost" size="sm">
                Avbryt
              </Button>
            </div>
          )}
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
                const isSelected = selectedFiles.has(file.id);
                const isInPortfolio = file.usage.some(u => u.usage_type === 'profile_portfolio');
                const Icon = getFileIcon(file.file_type);
                
                return (
                  <div
                    key={file.id}
                    className={`group relative aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      isSelected 
                        ? 'ring-2 ring-accent-orange bg-accent-orange/10' 
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                    onClick={() => toggleFileSelection(file.id)}
                    onMouseEnter={() => setHoveredFile(file.id)}
                    onMouseLeave={() => setHoveredFile(null)}
                  >
                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-accent-orange border-accent-orange' 
                          : 'bg-white/80 border-white/80'
                      }`}>
                        {isSelected && (
                          <div className="h-3 w-3 bg-white rounded-sm" />
                        )}
                      </div>
                    </div>

                    {/* Portfolio badge */}
                    {isInPortfolio && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-accent-orange text-white text-xs px-2 py-1 rounded">
                          Portefølje
                        </div>
                      </div>
                    )}

                    {/* File preview/icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {file.file_type === 'image' ? (
                        <img 
                          src={supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl}
                          alt={file.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : file.file_type === 'video' ? (
                        <video 
                          src={supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-muted/50">
                          <Icon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Hover overlay with actions */}
                    {isHovered && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 mb-2 flex-wrap justify-center">
                          {(file.file_type === 'image' || file.file_type === 'video') && (
                            <>
                              {file.file_type === 'image' && (
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-8 w-8"
                                  title="Sett som profilbilde"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const publicUrl = supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl;
                                    setImageForCrop(publicUrl);
                                    setCropModalOpen(true);
                                  }}
                                >
                                  <User className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const publicUrl = supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl;
                                  copyFileUrl(publicUrl);
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const publicUrl = supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl;
                                  downloadFile(publicUrl, file.filename);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
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

        <AvatarCropModal
          isOpen={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setImageForCrop(null);
          }}
          onAvatarUpdate={(newUrl) => {
            toast({
              title: 'Profilbilde oppdatert!',
              description: 'Ditt nye profilbilde er nå synlig på profilen din',
            });
            refetch();
          }}
          currentAvatarUrl={profile.avatar_url || undefined}
          userId={profile.user_id}
          initialImageUrl={imageForCrop || undefined}
        />
      </div>
    </div>
  );
};