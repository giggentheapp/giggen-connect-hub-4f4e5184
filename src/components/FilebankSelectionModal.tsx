import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Image, File, Check, X } from 'lucide-react';
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
  is_public?: boolean;
  thumbnail_path?: string;
}

interface FilebankSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: FilebankFile) => void;
  userId: string;
  category?: 'portfolio' | 'avatars' | 'all';
  fileTypes?: string[]; // e.g., ['image'], ['image', 'video', 'audio']
  title?: string;
  description?: string;
}

export const FilebankSelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  userId,
  category = 'all',
  fileTypes,
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
  }, [isOpen, userId, category, fileTypes]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      console.log('📂 Fetching filebank files:', { userId, category, fileTypes });
      
      if (!userId) {
        console.error('❌ No userId provided to FilebankSelectionModal');
        setLoading(false);
        return;
      }

      let query = supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Filter by category if specified
      if (category !== 'all') {
        query = query.ilike('file_path', `${category}/%`);
      }

      // Filter by file types if specified
      if (fileTypes && fileTypes.length > 0) {
        query = query.in('file_type', fileTypes);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching files:', error);
        throw error;
      }

      console.log('✅ Files fetched:', data?.length || 0, 'files');
      setFiles(data || []);
    } catch (error) {
      console.error('❌ Error in fetchFiles:', error);
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
    
    // Show thumbnail for video/audio if available
    if ((file.file_type === 'video' || file.file_type === 'audio') && file.thumbnail_path) {
      const thumbnailUrl = getPublicUrl(file.thumbnail_path);
      return (
        <img
          src={thumbnailUrl}
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full flex flex-col">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Ingen filer funnet i filbanken</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
          </div>
        </ScrollArea>

        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Avbryt
              </Button>
              <Button onClick={handleSelect} disabled={!selectedFile}>
                Velg fil
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
