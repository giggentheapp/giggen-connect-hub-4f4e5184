import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, Video, Music, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';

interface ConceptPortfolioFile {
  tempId?: string | number;
  id?: string;
  filename: string;
  file_path: string;
  file_type: string;
  publicUrl?: string;
  file_size?: number;
  mime_type?: string;
  title?: string;
  uploadedAt?: string;
}

interface ConceptPortfolioUploadProps {
  userId: string;
  files: ConceptPortfolioFile[];
  onFileUploaded: (fileData: any) => void;
  onFileRemoved: (fileData: ConceptPortfolioFile) => void;
}

export const ConceptPortfolioUpload = ({
  userId,
  files,
  onFileUploaded,
  onFileRemoved
}: ConceptPortfolioUploadProps) => {
  const { toast } = useToast();

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <Image className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('video')) return <Video className="h-4 w-4 text-red-500" />;
    if (fileType.includes('audio')) return <Music className="h-4 w-4 text-green-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Konsept Portefølje</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Last opp mediefiler som viser konseptet ditt (bilder, videoer, lyd, dokumenter)
        </p>
        
        <FileUpload
          bucketName="concepts"
          folderPath={`portfolio/${userId}`}
          onFileUploaded={onFileUploaded}
          acceptedTypes=".jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav,.pdf,.doc,.docx"
        />

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <Label>Lastede filer ({files.length}):</Label>
            <div className="grid gap-3">
              {files.map((file, index) => (
                <div key={file.tempId || file.id || index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.title || file.filename}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{file.file_type.split('/')[0]}</span>
                        {file.file_size && <span>• {formatFileSize(file.file_size)}</span>}
                        {file.uploadedAt && (
                          <span>• {new Date(file.uploadedAt).toLocaleTimeString('no-NO')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemoved(file)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceptPortfolioUpload;