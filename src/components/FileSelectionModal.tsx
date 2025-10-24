import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileWithUsage } from '@/hooks/useUserFiles';
import { useState } from 'react';
import { FileImage, FileVideo, FileAudio, FileText, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FileSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileWithUsage[];
  allowedTypes?: string[]; // e.g., ['image', 'video'] for portfolio, ['document'] for tech specs
  onFileSelected: (file: FileWithUsage) => void;
  title?: string;
}

export const FileSelectionModal = ({
  open,
  onOpenChange,
  files,
  allowedTypes,
  onFileSelected,
  title = 'Velg fra Filbank'
}: FileSelectionModalProps) => {
  const [search, setSearch] = useState('');

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
            {filteredFiles.map(file => (
              <button
                key={file.id}
                onClick={() => {
                  onFileSelected(file);
                  onOpenChange(false);
                }}
                className="border rounded-lg p-3 hover:border-primary transition-colors text-left"
              >
                {renderFilePreview(file)}
                <div className="mt-2">
                  <p className="text-sm font-medium truncate">{file.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.usage.length > 0 ? `Brukt i ${file.usage.length} ${file.usage.length === 1 ? 'sted' : 'steder'}` : 'Ikke brukt'}
                  </p>
                </div>
              </button>
            ))}
          </div>
          
          {filteredFiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Ingen filer funnet
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
