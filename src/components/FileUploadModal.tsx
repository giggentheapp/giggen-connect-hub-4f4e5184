import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Image, Video, Music, FileText, Coffee, Upload } from 'lucide-react';
import { logger } from '@/utils/logger';

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  userId: string;
}

type FileCategory = 'image' | 'video' | 'audio' | 'tech_spec' | 'hospitality_rider';

const categories = [
  { value: 'image' as FileCategory, label: 'Bilde', icon: Image, accept: 'image/*', category: 'image' },
  { value: 'video' as FileCategory, label: 'Video', icon: Video, accept: 'video/*', category: 'video' },
  { value: 'audio' as FileCategory, label: 'Lydfil', icon: Music, accept: 'audio/*', category: 'audio' },
  { value: 'tech_spec' as FileCategory, label: 'Tech Spec', icon: FileText, accept: '.pdf,.doc,.docx', category: 'tech_spec' },
  { value: 'hospitality_rider' as FileCategory, label: 'Hospitality Rider', icon: Coffee, accept: '.pdf,.doc,.docx', category: 'hospitality_rider' },
];

export const FileUploadModal = ({ open, onClose, onUploadComplete, userId }: FileUploadModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCategory) return;

    setUploading(true);
    try {
      const category = categories.find(c => c.value === selectedCategory);
      if (!category) throw new Error('Invalid category');

      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${category.category}/${timestamp}_${sanitizedFileName}`;

      // Upload to unified filbank bucket
      const { error: uploadError } = await supabase.storage
        .from('filbank')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Determine file type for database
      const fileType = file.type.startsWith('image/') ? 'image' :
                      file.type.startsWith('video/') ? 'video' :
                      file.type.startsWith('audio/') ? 'audio' : 'document';

      // Insert into user_files
      const { error: dbError } = await supabase
        .from('user_files')
        .insert({
          user_id: userId,
          filename: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
          mime_type: file.type,
          category: selectedCategory,
          is_public: false,
          bucket_name: 'filbank'
        });

      if (dbError) throw dbError;

      toast({
        title: 'Fil lastet opp',
        description: `${file.name} er nå tilgjengelig i filbanken.`,
      });

      onUploadComplete();
      onClose();
      setSelectedCategory(null);
    } catch (err) {
      logger.error('File upload failed', err);
      toast({
        title: 'Opplasting feilet',
        description: err instanceof Error ? err.message : 'Ukjent feil',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Last opp fil</DialogTitle>
          <DialogDescription>
            Velg filtype og last opp til filbanken
          </DialogDescription>
        </DialogHeader>

        {!selectedCategory ? (
          <div className="grid grid-cols-2 gap-3 py-4">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => setSelectedCategory(cat.value)}
              >
                <cat.icon className="h-8 w-8" />
                <span className="text-sm">{cat.label}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              {categories.find(c => c.value === selectedCategory)?.icon && (
                <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10">
                  {(() => {
                    const Icon = categories.find(c => c.value === selectedCategory)!.icon;
                    return <Icon className="h-6 w-6 text-primary" />;
                  })()}
                </div>
              )}
              <div>
                <p className="font-medium">
                  {categories.find(c => c.value === selectedCategory)?.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  Velg fil å laste opp
                </p>
              </div>
            </div>

            <Label
              htmlFor="file-upload"
              className="flex items-center justify-center gap-2 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-6 w-6" />
              <span>Klikk for å velge fil</span>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                accept={categories.find(c => c.value === selectedCategory)?.accept}
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </Label>

            <Button
              variant="ghost"
              onClick={() => setSelectedCategory(null)}
              disabled={uploading}
              className="w-full"
            >
              Tilbake
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
