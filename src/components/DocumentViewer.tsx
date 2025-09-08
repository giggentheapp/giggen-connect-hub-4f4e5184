import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, AlertCircle } from 'lucide-react';

interface DocumentFile {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  mime_type?: string;
  file_size?: number;
}

interface DocumentViewerProps {
  files: DocumentFile[];
  title: string;
  isVisible: boolean;
  notProvidedMessage?: string;
}

export const DocumentViewer = ({ 
  files, 
  title, 
  isVisible, 
  notProvidedMessage = "Ikke lagt ved" 
}: DocumentViewerProps) => {
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText;
    
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('image')) return Eye;
    if (mimeType.includes('text')) return FileText;
    
    return FileText;
  };

  const canPreview = (mimeType?: string) => {
    if (!mimeType) return false;
    return mimeType.includes('pdf') || mimeType.includes('image') || mimeType.includes('text');
  };

  if (!isVisible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Kun synlig for partene etter booking er godkjent av begge
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!files || files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{notProvidedMessage}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.mime_type);
              const canPreviewFile = canPreview(file.mime_type);
              
              return (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{file.filename}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {file.file_type}
                        </Badge>
                        {file.file_size && (
                          <span>{formatFileSize(file.file_size)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {canPreviewFile && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(file);
                          setPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Forhåndsvis
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="default"
                      asChild
                    >
                      <a
                        href={file.file_url}
                        download={file.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Last ned
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* File Preview Dialog */}
      {selectedFile && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {selectedFile.filename}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              {selectedFile.mime_type?.includes('pdf') && (
                <iframe
                  src={selectedFile.file_url}
                  className="w-full h-[70vh] border rounded"
                  title={selectedFile.filename}
                />
              )}
              
              {selectedFile.mime_type?.includes('image') && (
                <div className="flex justify-center">
                  <img
                    src={selectedFile.file_url}
                    alt={selectedFile.filename}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                  />
                </div>
              )}
              
              {selectedFile.mime_type?.includes('text') && (
                <div className="p-4 border rounded bg-muted/50 h-[70vh] overflow-auto">
                  <iframe
                    src={selectedFile.file_url}
                    className="w-full h-full border-0"
                    title={selectedFile.filename}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" asChild>
                <a
                  href={selectedFile.file_url}
                  download={selectedFile.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Last ned
                </a>
              </Button>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Lukk
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};