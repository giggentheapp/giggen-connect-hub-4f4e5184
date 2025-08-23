import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Edit, Trash2, Save, X, Image, Video, Music, File } from 'lucide-react';

interface PortfolioFile {
  id: string;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  title?: string;
  description?: string;
  created_at: string;
}

interface PortfolioManagerProps {
  bucketName: 'portfolio' | 'concepts' | 'avatars';
  folderPath: string;
  userId: string;
  title: string;
  description: string;
}

const PortfolioManager = ({ bucketName, folderPath, userId, title, description }: PortfolioManagerProps) => {
  const [files, setFiles] = useState<PortfolioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, [bucketName, folderPath]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      // Skip database fetch for avatars bucket
      if (bucketName === 'avatars') {
        setFiles([]);
        setLoading(false);
        return;
      }

      if (bucketName === 'portfolio') {
        // Portfolio items from portfolio table  
        const { data, error } = await supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedData: PortfolioFile[] = data?.map((item) => ({
          id: item.id.toString(),
          filename: item.title || 'Portfolio element',
          file_path: '', // Portfolio items don't store files in storage
          file_type: 'document', 
          file_size: 0,
          mime_type: 'application/octet-stream',
          title: item.title,
          description: item.description,
          created_at: item.created_at
        })) || [];
        
        setFiles(mappedData);
      } else {
        // Concept files from concept_files table
        const { data, error } = await supabase
          .from('concept_files')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedData: PortfolioFile[] = data?.map((item) => ({
          id: item.id,
          filename: item.filename,
          file_path: item.file_path,
          file_type: item.file_type,
          file_size: item.file_size || 0,
          mime_type: item.mime_type || 'application/octet-stream',
          title: item.title,
          description: item.description,
          created_at: item.created_at
        })) || [];
        
        setFiles(mappedData);
      }
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast({
        title: "Feil ved lasting av filer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!uploadTitle.trim()) {
      toast({
        title: "Tittel påkrevd",
        description: "Legg til en tittel for filen",
        variant: "destructive",
      });
      return;
    }

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

      // Save metadata to database (except for avatars)
      if (bucketName === 'avatars') {
        toast({
          title: "Fil lastet opp",
          description: `${file.name} ble lastet opp successfully`,
        });

        // Reset form and refresh files
        setUploadTitle('');
        setUploadDescription('');
        (event.target as HTMLInputElement).value = '';
        fetchFiles();
        return;
      }

      const fileType = getFileType(file.type);
      
      // Insert into appropriate table based on bucket
      let dbData;
      if (bucketName === 'portfolio') {
        // For portfolio, save to portfolio_files table
        const portfolioData = {
          user_id: userId,
          title: uploadTitle,
          description: uploadDescription || null,
          file_url: publicUrl
        };
        
        const { data, error: dbError } = await supabase
          .from('portfolio')
          .insert(portfolioData)
          .select()
          .single();
        if (dbError) throw dbError;
        dbData = data;
      } else if (bucketName === 'concepts') {
        // For concepts, first ensure a concept exists for the user
        let conceptId;
        
        // Check if user has any existing concept
        const { data: existingConcept, error: conceptError } = await supabase
          .from('concepts')
          .select('id')
          .eq('maker_id', userId)
          .limit(1)
          .single();
          
        if (conceptError && conceptError.code !== 'PGRST116') { // PGRST116 = no rows found
          throw conceptError;
        }
        
        if (existingConcept) {
          conceptId = existingConcept.id;
        } else {
          // Create new concept for the user
          const { data: newConcept, error: createError } = await supabase
            .from('concepts')
            .insert({
              maker_id: userId,
              title: 'Nytt konsept',
              description: 'Automatisk opprettet konsept',
              status: 'draft'
            })
            .select('id')
            .single();
            
          if (createError) throw createError;
          conceptId = newConcept.id;
        }
        
        // Now save the file with the concept_id
        const conceptFileData = {
          concept_id: conceptId,
          user_id: userId,
          creator_id: userId,
          file_type: fileType,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          is_public: true,
          title: uploadTitle,
          description: uploadDescription || null,
          file_url: publicUrl
        };
        
        const { data, error: dbError } = await supabase
          .from('concept_files')
          .insert(conceptFileData)
          .select()
          .single();
        if (dbError) throw dbError;
        dbData = data;
      }

      toast({
        title: "Fil lastet opp",
        description: `${file.name} ble lastet opp successfully`,
      });

      // Reset form and refresh files
      setUploadTitle('');
      setUploadDescription('');
      (event.target as HTMLInputElement).value = '';
      fetchFiles();

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

  const handleEditSave = async (fileId: string) => {
    // Skip edit for avatars bucket
    if (bucketName === 'avatars') {
      toast({
        title: "Redigering ikke tilgjengelig",
        description: "Profilbilder kan ikke redigeres",
        variant: "destructive",
      });
      return;
    }

    try {
      const tableName = bucketName === 'portfolio' ? 'portfolio' : 'concept_files';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          title: editTitle,
          description: editDescription || null
        })
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: "Fil oppdatert",
        description: "Tittel og beskrivelse er lagret",
      });

      setEditingFile(null);
      fetchFiles();
    } catch (error: any) {
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: PortfolioFile) => {
    try {
      // Delete from storage only if it's a concept file (has file_path)
      if (file.file_path && bucketName === 'concepts') {
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([file.file_path]);

        if (storageError) throw storageError;
      }

      // Delete from database (except for avatars)
      if (bucketName !== 'avatars') {
        const tableName = bucketName === 'portfolio' ? 'portfolio' : 'concept_files';
        const { error: dbError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', file.id);

        if (dbError) throw dbError;
      }

      toast({
        title: "Element slettet",
        description: `${file.title || file.filename} ble slettet`,
      });

      fetchFiles();
    } catch (error: any) {
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEdit = (file: PortfolioFile) => {
    setEditingFile(file.id);
    setEditTitle(file.title || '');
    setEditDescription(file.description || '');
  };

  const cancelEdit = () => {
    setEditingFile(null);
    setEditTitle('');
    setEditDescription('');
  };

  const getPublicUrl = (filePath: string) => {
    return supabase.storage.from(bucketName).getPublicUrl(filePath).data.publicUrl;
  };

  const renderFilePreview = (file: PortfolioFile) => {
    const url = getPublicUrl(file.file_path);
    
    switch (file.file_type) {
      case 'image':
        return (
          <img 
            src={url} 
            alt={file.title || file.filename}
            className="w-full h-32 object-cover rounded"
          />
        );
      case 'video':
        return (
          <video 
            src={url} 
            className="w-full h-32 object-cover rounded"
            controls
          />
        );
      case 'audio':
        return (
          <div className="w-full h-32 flex items-center justify-center bg-muted rounded">
            <audio src={url} controls className="w-full" />
          </div>
        );
      default:
        return (
          <div className="w-full h-32 flex items-center justify-center bg-muted rounded">
            {getFileIcon(file.file_type)}
            <span className="ml-2 text-sm">{file.filename}</span>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload form */}
        <div className="space-y-3 p-4 border rounded-lg">
          <div>
            <Label htmlFor="upload-title">Tittel *</Label>
            <Input
              id="upload-title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Gi filen en tittel..."
              disabled={uploading}
            />
          </div>
          
          <div>
            <Label htmlFor="upload-description">Beskrivelse (valgfri)</Label>
            <Textarea
              id="upload-description"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Legg til en beskrivelse..."
              disabled={uploading}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="file-upload">Fil</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav,.pdf,.docx,.txt"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="text-sm text-muted-foreground">
              Laster opp fil...
            </div>
          )}
        </div>

        {/* Files list */}
        {loading ? (
          <div className="text-center p-4">Laster filer...</div>
        ) : files.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            Ingen filer lastet opp ennå
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  {renderFilePreview(file)}
                  
                  <div className="mt-3 space-y-2">
                    {editingFile === file.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Tittel"
                        />
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Beskrivelse (valgfri)"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEditSave(file.id)}>
                            <Save className="h-3 w-3 mr-1" />
                            Lagre
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="h-3 w-3 mr-1" />
                            Avbryt
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium">{file.title || file.filename}</h4>
                        {file.description && (
                          <p className="text-sm text-muted-foreground">{file.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.file_size)}
                          </span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => startEdit(file)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDelete(file)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioManager;