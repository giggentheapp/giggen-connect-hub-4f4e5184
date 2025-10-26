import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Image, File, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilebankFile {
  id: string;
  filename: string;
  file_path: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  category?: string;
}

interface FilebankSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: FilebankFile) => void;
  userId: string;
  category?: 'portfolio' | 'avatars' | 'all';
  title?: string;
  description?: string;
}

export const FilebankSelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  userId,
  category = 'all',
  title = 'Velg fra Filbank',
  description = 'Velg en fil fra din filbank'
}: FilebankSelectionModalProps) => {
  const [files, setFiles] = useState<FilebankFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FilebankFile | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen, userId, category]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Filter by category if specified
      if (category !== 'all') {
        query = query.ilike('file_path', `${category}/%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile);
      onClose();
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const renderFilePreview = (file: FilebankFile) => {
    const publicUrl = getPublicUrl(file.file_path);
    
    if (file.file_type === 'image' || file.mime_type?.startsWith('image/')) {
      return (
        <img
          src={publicUrl}
          alt={file.filename}
          className="w-full h-32 object-cover rounded"
        />
      );
    }
    
    return (
      <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
        <File className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Ingen filer funnet i filbanken</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {files.map((file) => (
                <Card
                  key={file.id}
                  className={`cursor-pointer hover:border-primary transition-all ${
                    selectedFile?.id === file.id ? 'border-primary ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="relative">
                      {renderFilePreview(file)}
                      {selectedFile?.id === file.id && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium truncate" title={file.filename}>
                        {file.filename}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {file.file_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button onClick={handleSelect} disabled={!selectedFile}>
            Velg fil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
