import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Image, Check, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { BackgroundArtwork } from '@/components/BackgroundArtwork';
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
}

interface SelectBackgroundImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedPaths: string[]) => Promise<void>;
  userId: string;
  currentSelection?: string[] | null;
}

export const SelectBackgroundImagesModal = ({
  isOpen,
  onClose,
  onSave,
  userId,
  currentSelection = []
}: SelectBackgroundImagesModalProps) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FilebankFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>(currentSelection || []);

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
      setSelectedPaths(currentSelection || []);
    }
  }, [isOpen, userId, currentSelection]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .eq('file_type', 'image')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const toggleSelection = (filePath: string) => {
    setSelectedPaths(prev => {
      if (prev.includes(filePath)) {
        return prev.filter(p => p !== filePath);
      }
      if (prev.length >= 6) {
        return prev; // Max 6 images
      }
      return [...prev, filePath];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(selectedPaths);
      onClose();
    } catch (error) {
      console.error('Error saving selection:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      setSaving(true);
      await onSave([]);
      setSelectedPaths([]);
      onClose();
    } catch (error) {
      console.error('Error clearing selection:', error);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent side="right" className="w-full sm:max-w-6xl p-0 overflow-y-auto z-[60]" onInteractOutside={(e) => e.preventDefault()}>
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Velg bakgrunnsbilder</SheetTitle>
          <SheetDescription>
            Velg opptil 6 bilder fra filbanken din. Disse vil vises som subtile bakgrunner på dashboard og profil.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Live Preview */}
          {selectedPaths.length > 0 && (
            <div className="relative h-32 rounded-lg overflow-hidden border bg-muted/20">
              <BackgroundArtwork 
                imagePaths={selectedPaths} 
                intensity={0.15}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Badge variant="secondary">
                  Forhåndsvisning ({selectedPaths.length} bilder)
                </Badge>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Ingen bilder funnet</p>
                <p className="text-sm text-muted-foreground">Last opp bilder til filbanken for å bruke dem som bakgrunn</p>
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
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedPaths.length}/6 bilder valgt
                </p>
                {selectedPaths.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPaths([])}>
                    Fjern alle
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {files.map((file) => {
                  const isSelected = selectedPaths.includes(file.file_path);
                  return (
                    <Card
                      key={file.id}
                      className={`cursor-pointer hover:border-primary transition-all ${
                        isSelected ? 'border-primary ring-2 ring-primary' : ''
                      }`}
                      onClick={() => toggleSelection(file.file_path)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="relative">
                          <img
                            src={getPublicUrl(file.file_path)}
                            alt={file.filename}
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-4 w-4" />
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
            </>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            
            {(currentSelection?.length || 0) > 0 && (
              <Button 
                variant="outline"
                onClick={handleClear}
                disabled={saving}
              >
                Fjern alle bakgrunner
              </Button>
            )}
            
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="ml-auto"
            >
              {saving ? 'Lagrer...' : `Lagre (${selectedPaths.length} bilder)`}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  return isOpen ? createPortal(content, document.body) : null;
};
