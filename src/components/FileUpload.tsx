import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Image, Video, Music } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface FileUploadProps {
  bucketName: 'portfolio' | 'concepts' | 'avatars';
  folderPath: string;
  onFileUploaded: (file: any) => void;
  acceptedTypes?: string;
  targetTable?: 'profile_portfolio' | 'profile_tech_specs' | 'concept_files' | 'hospitality_riders' | null;
}

const FileUpload = ({ bucketName, folderPath, onFileUploaded, acceptedTypes = ".jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav,.pdf,.docx,.txt", targetTable = null }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useAppTranslation();

  const getFileType = (mimeType: string): string => {
    // Categorize MIME types for database constraints
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
        throw new Error(`Upload feilet: ${uploadError.message}`);
      }

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
          title: t('fileUploadSuccess'),
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

      // Insert into appropriate table based on targetTable parameter
      let dbData;
      if (targetTable === 'profile_portfolio') {
        const { data, error: dbError } = await supabase
          .from('profile_portfolio')
          .insert({
            user_id: user.id,
            file_url: publicUrl,
            file_path: filePath,
            filename: file.name,
            file_type: fileType,
            mime_type: file.type,
            file_size: file.size,
            is_public: true,
            title: file.name
          })
          .select()
          .single();
        if (dbError) throw dbError;
        dbData = data;
      } else if (targetTable === 'profile_tech_specs') {
        const { data, error: dbError } = await supabase
          .from('profile_tech_specs')
          .insert({
            profile_id: user.id,
            file_url: publicUrl,
            file_path: filePath,
            filename: file.name,
            file_type: fileType,
            mime_type: file.type,
            file_size: file.size
          })
          .select()
          .single();
        if (dbError) throw dbError;
        dbData = data;
      } else if (targetTable === 'hospitality_riders') {
        const { data, error: dbError } = await supabase
          .from('hospitality_riders')
          .insert({
            user_id: user.id,
            file_url: publicUrl,
            file_path: filePath,
            filename: file.name,
            file_type: fileType,
            mime_type: file.type,
            file_size: file.size
          })
          .select()
          .single();
        if (dbError) throw dbError;
        dbData = data;
      } else if (targetTable === 'concept_files') {
        // This case shouldn't happen as concepts are handled differently
        // But we'll add it for completeness
        dbData = {
          ...baseFileData,
          publicUrl,
          filename: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
          mime_type: file.type,
          creator_id: user.id
        };
      } else {
        // For when no targetTable specified, let parent handle database operations
        dbData = {
          ...baseFileData,
          publicUrl,
          filename: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
          mime_type: file.type,
          creator_id: user.id
        };
      }

      // Call parent callback
      onFileUploaded(dbData);

      toast({
        title: t('fileUploadSuccess'),
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
        title: t('fileUploadError'),
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
          {t('uploadFile')}
        </CardTitle>
        <CardDescription>
          {t('supportedFormatsDetailed')}
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
            {uploading ? t('uploadingFile') : t('selectFile')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;