import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Image, Video, Music } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface FileUploadProps {
  fileType: 'portfolio' | 'hospitality' | 'tech-spec' | 'concepts' | 'avatars';
  folderPath: string;
  onFileUploaded: (file: any) => void;
  acceptedTypes?: string;
  targetTable?: 'profile_portfolio' | 'profile_tech_specs' | 'concept_files' | 'hospitality_riders' | null;
}

const FileUpload = ({ fileType, folderPath, onFileUploaded, acceptedTypes = ".jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav,.pdf,.docx,.txt", targetTable = null }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useAppTranslation();

  const getFileType = (fileName: string, mimeType: string): string => {
    // Enhanced categorization - check both MIME type and file extension
    const audioExtensions = /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i;
    const videoExtensions = /\.(mp4|mov|avi|mkv|webm|flv)$/i;
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i;
    
    // Check MIME type first
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    
    // Fallback to file extension for cases where MIME type is generic or missing
    if (audioExtensions.test(fileName)) return 'audio';
    if (videoExtensions.test(fileName)) return 'video';
    if (imageExtensions.test(fileName)) return 'image';
    
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

      // All files go to filbank with category structure
      const bucketName = 'filbank';
      
      // Map fileType to category
      let category: string;
      switch(fileType) {
        case 'hospitality':
          category = 'hospitality';
          break;
        case 'tech-spec':
          category = 'tech-specs';
          break;
        case 'concepts':
          category = 'concepts';
          break;
        case 'avatars':
          category = 'avatars';
          break;
        case 'portfolio':
        default:
          category = 'portfolio';
          break;
      }

      // Create file path: user_id/category/timestamp-filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9._\-æøåÆØÅ]/g, '_')
        .replace(/_{2,}/g, '_');
      const fileName = `${timestamp}-${sanitizedFileName}`;
      const filePath = `${user.id}/${category}/${fileName}`;

      console.log('🎯 Creating file at path:', filePath);

      // Upload
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file); // <-- Bruk filePath

      if (uploadError) throw uploadError;

      // Get URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath); // <-- Bruk filePath

      console.log('✅ File uploaded to:', filePath);
      console.log('🔗 Public URL:', publicUrl);

      console.log('✅ File uploaded successfully:', {
        filename: file.name,
        filePath: filePath,
        publicUrl: publicUrl,
        bucketName: bucketName
      });

      // Save metadata to database
      const dbFileType = getFileType(file.name, file.type);
      
      console.log('📁 File type detection:', {
        filename: file.name,
        mimeType: file.type,
        detectedType: dbFileType,
        fileSize: file.size
      });
      
      // Determine which table to use based on fileType
      if (fileType === 'avatars') {
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
        file_type: dbFileType,
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
            file_type: dbFileType,
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
            file_type: dbFileType,
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
            file_type: dbFileType,
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
          file_type: dbFileType,
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
          file_type: dbFileType,
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
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
        id={`file-upload-${fileType}`}
      />
      <label
        htmlFor={`file-upload-${fileType}`}
        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-muted-foreground/40 transition-colors cursor-pointer bg-muted/20 hover:bg-muted/30"
      >
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {uploading ? t('uploadingFile') : t('selectFile')}
        </span>
      </label>
    </div>
  );
};

export default FileUpload;