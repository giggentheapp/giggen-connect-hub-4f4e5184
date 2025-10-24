import { useState } from 'react';
import { useUserFiles, FileWithUsage } from '@/hooks/useUserFiles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { FileImage, FileVideo, FileAudio, FileText, File, Trash2, Upload, Search } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const FileBank = () => {
  const [userId, setUserId] = useState<string>();
  const { files, loading, deleteFile, refetch } = useUserFiles(userId);
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileWithUsage | null>(null);
  const { toast } = useToast();

  // Get current user
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image')) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (fileType.startsWith('video')) return <FileVideo className="w-8 h-8 text-purple-500" />;
    if (fileType.startsWith('audio')) return <FileAudio className="w-8 h-8 text-green-500" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const getUsageLabel = (usageType: string) => {
    const labels: Record<string, string> = {
      'profile_portfolio': 'Profilportefølje',
      'tech_spec': 'Tekniske spesifikasjoner',
      'hospitality_rider': 'Hospitality Rider',
      'band_portfolio': 'Bandportefølje',
      'band_tech_spec': 'Band Tech Spec',
      'band_hospitality': 'Band Hospitality'
    };
    return labels[usageType] || usageType;
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

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(search.toLowerCase())
  );

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Ukjent størrelse';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Laster filer...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Filbank</h1>
        <p className="text-muted-foreground">
          Administrer alle filene dine på ett sted
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter filer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => toast({ title: 'Kommer snart', description: 'Filopplasting kommer snart' })}>
          <Upload className="w-4 h-4 mr-2" />
          Last opp fil
        </Button>
      </div>

      {filteredFiles.length === 0 ? (
        <Card className="p-12 text-center">
          <File className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Ingen filer</h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'Ingen filer matcher søket ditt' : 'Du har ikke lastet opp noen filer ennå'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFiles.map(file => (
            <Card key={file.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon(file.file_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{file.filename}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span>{file.file_type}</span>
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>
                      Lastet opp {format(new Date(file.created_at), 'dd. MMM yyyy', { locale: nb })}
                    </span>
                  </div>
                  
                  {file.usage.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Brukt i:</p>
                      <div className="flex flex-wrap gap-2">
                        {file.usage.map(usage => (
                          <span
                            key={usage.id}
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                          >
                            {getUsageLabel(usage.usage_type)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedFile(file);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett fil?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedFile?.usage.length ? (
                <>
                  Denne filen brukes i <strong>{selectedFile.usage.length}</strong> {selectedFile.usage.length === 1 ? 'sted' : 'steder'}.
                  Hvis du sletter den, vil den fjernes fra alle disse stedene.
                </>
              ) : (
                'Denne filen brukes ikke noe sted. Den vil bli permanent slettet.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FileBank;
