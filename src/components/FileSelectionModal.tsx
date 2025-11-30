import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FileWithUsage } from '@/hooks/useUserFiles';
import { useState } from 'react';
import { FileImage, FileVideo, FileAudio, FileText, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FileSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileWithUsage[];
  allowedTypes?: string[]; // e.g., ['image', 'video'] for portfolio, ['document'] for tech specs
  onFilesSelected: (files: FileWithUsage[]) => void;
  title?: string;
  userId?: string; // For navigation to filbank
}

export const FileSelectionModal = ({
  open,
  onOpenChange,
  files,
  allowedTypes,
  onFilesSelected,
  title = 'Velg fra Filbank',
  userId
}: FileSelectionModalProps) => {
  const [search, setSearch] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image')) return <FileImage className="w-5 h-5" />;
    if (fileType.startsWith('video')) return <FileVideo className="w-5 h-5" />;
    if (fileType.startsWith('audio')) return <FileAudio className="w-5 h-5" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getPublicUrl = (filePath: string) => {
    const bucket = filePath.split('/')[0];
    const path = filePath.substring(filePath.indexOf('/') + 1);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.filename.toLowerCase().includes(search.toLowerCase());
    const matchesType = !allowedTypes || allowedTypes.some(type => {
      // Check file_type, mime_type, and category
      const fileTypeLower = file.file_type.toLowerCase();
      const mimeTypeLower = (file.mime_type || '').toLowerCase();
      const categoryLower = ((file as any).category || '').toLowerCase();
      const typeLower = type.toLowerCase();
      
      return fileTypeLower.includes(typeLower) || 
             mimeTypeLower.includes(typeLower) || 
             categoryLower.includes(typeLower);
    });
    return matchesSearch && matchesType;
  });

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const selected = files.filter(f => selectedFiles.has(f.id));
    onFilesSelected(selected);
    setSelectedFiles(new Set());
    onOpenChange(false);
  };

  const renderFilePreview = (file: FileWithUsage) => {
    if (file.file_type.startsWith('image')) {
      return (
        <img 
          src={getPublicUrl(file.file_path)} 
          alt={file.filename}
          className="w-full h-32 object-cover rounded"
        />
      );
    }
    return (
      <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
        {getFileIcon(file.file_type)}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Velg en fil fra filbanken din
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <Input
            placeholder="Søk etter fil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map(file => {
              const isSelected = selectedFiles.has(file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => toggleFileSelection(file.id)}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="relative">
                    {renderFilePreview(file)}
                    <div className="absolute top-2 right-2">
                      <Checkbox 
                        checked={isSelected}
                        className="bg-background shadow-md"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.usage.length > 0 ? `Brukt i ${file.usage.length} ${file.usage.length === 1 ? 'sted' : 'steder'}` : 'Ikke brukt'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <File className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Ingen filer funnet i filbanken</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Last opp filer til filbanken for å velge dem her
                </p>
              </div>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  const targetUserId = userId || files[0]?.user_id || '';
                  if (targetUserId) {
                    window.location.href = `/profile/${targetUserId}?section=filbank`;
                  }
                }}
                className="gap-2"
                disabled={!userId && files.length === 0}
              >
                <File className="h-4 w-4" />
                Gå til Filbank
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleConfirm} disabled={selectedFiles.size === 0}>
            Legg til {selectedFiles.size > 0 && `(${selectedFiles.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
