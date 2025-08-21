import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Image, Video, Music } from 'lucide-react';

interface FileUploadProps {
  bucketName: 'portfolio' | 'concepts';
  folderPath: string;
  onFileUploaded: (file: any) => void;
  acceptedTypes?: string;
}

const FileUpload = ({ bucketName, folderPath, onFileUploaded, acceptedTypes = ".jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav,.pdf,.docx,.txt" }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Save metadata to database
      const fileType = getFileType(file.type);
      const tableName = bucketName === 'portfolio' ? 'portfolio_files' : 'concept_files';
      
      const fileData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        file_type: fileType,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        is_public: true
      };

      // Add concept_id for concept files
      if (bucketName === 'concepts') {
        const conceptId = folderPath.split('/')[1]; // Extract concept_id from folderPath
        (fileData as any).concept_id = conceptId;
      }

      const { data: dbData, error: dbError } = await supabase
        .from(tableName)
        .insert(fileData)
        .select()
        .single();

      if (dbError) throw dbError;

      // Call parent callback
      onFileUploaded({ ...dbData, publicUrl });

      toast({
        title: "Fil lastet opp",
        description: `${file.name} ble lastet opp successfully`,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Feil ved opplasting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Last opp fil
        </CardTitle>
        <CardDescription>
          Støttede formater: Bilder (JPG, PNG, GIF), Video (MP4, MOV), Lyd (MP3, WAV), Dokumenter (PDF, DOCX, TXT)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
          >
            {uploading ? 'Laster opp...' : 'Velg fil'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;