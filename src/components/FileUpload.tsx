import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Image, Video, Music } from 'lucide-react';

interface FileUploadProps {
  bucketName: 'portfolio' | 'concepts' | 'avatars';
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
      // Get current user for path structure
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Must be authenticated to upload files');
      }

      // Generate unique filename with user ID in path for RLS policies
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      let filePath: string;
      
      if (bucketName === 'concepts') {
        // For concepts, put user ID first to match RLS policy
        filePath = `${user.id}/${fileName}`;
      } else {
        filePath = `${folderPath}/${fileName}`;
      }

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload feilet: ${uploadError.message}`);
      }

      console.log('File uploaded to storage successfully:', filePath);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Save metadata to database
      const fileType = getFileType(file.type);
      
      // Determine which table to use based on bucket
      if (bucketName === 'avatars') {
        // For avatars, we don't save to database tables, just return file info
        onFileUploaded({ publicUrl });
        toast({
          title: "Fil lastet opp",
          description: `${file.name} ble lastet opp successfully`,
        });
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const baseFileData = {
        user_id: user.id,
        file_type: fileType,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        is_public: true
      };

      // Insert into appropriate table based on bucket
      let dbData;
      if (bucketName === 'portfolio') {
        const { data, error: dbError } = await supabase
          .from('portfolio_files')
          .insert(baseFileData)
          .select()
          .single();
        if (dbError) throw dbError;
        dbData = data;
      } else if (bucketName === 'concepts') {
        // For concepts, don't insert to database here - let the parent component handle it
        dbData = {
          ...baseFileData,
          publicUrl,
          filename: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
          mime_type: file.type,
          user_id: user.id
        };
      }

      // Call parent callback
      onFileUploaded(dbData);

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
      let errorMessage = 'En ukjent feil oppstod';
      
      if (error.message?.includes('row-level security policy')) {
        errorMessage = 'Tilgangsfeil - sjekk at du er logget inn og har rettigheter';
      } else if (error.message?.includes('file size')) {
        errorMessage = 'Filen er for stor (maks 50MB)';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Feil ved opplasting",
        description: errorMessage,
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