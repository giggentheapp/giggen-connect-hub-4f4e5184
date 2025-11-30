import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Image, File, Check, X, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
  const navigate = useNavigate();
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
      console.log('✅ File selected, calling onSelect');
      onSelect(selectedFile);
      setSelectedFile(null); // Reset selection
      console.log('🔘 Closing modal after selection');
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

  const content = (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent side="right" className="w-full sm:max-w-6xl p-0 overflow-y-auto z-[60]" onInteractOutside={(e) => e.preventDefault()}>
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Ingen filer funnet i filbanken</p>
                <p className="text-sm text-muted-foreground">Last opp filer til filbanken for å velge dem her</p>
              </div>
              <Button
                onClick={() => {
                  onClose();
                  navigate(`/profile/${userId}?section=filbank`);
                }}
                className="mt-4"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Gå til Filbank
              </Button>
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

        <SheetFooter className="px-6 py-4 border-t">
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            Avbryt
          </Button>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelect();
            }} 
            disabled={!selectedFile}
          >
            Velg fil
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  return isOpen ? createPortal(content, document.body) : null;
};
