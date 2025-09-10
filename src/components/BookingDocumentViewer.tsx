import { FileText, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import React from 'react';
interface BookingDocumentViewerProps {
  techSpec: string | null;
  hospitalityRider: string | null;
  bookingStatus: string;
  isVisible: boolean; // Only show after booking is accepted
}
export const BookingDocumentViewer = ({
  techSpec,
  hospitalityRider,
  bookingStatus,
  isVisible
}: BookingDocumentViewerProps) => {
  const [viewingDocument, setViewingDocument] = useState<{url: string, title: string} | null>(null);
  
  if (!isVisible) {
    return;
  }

  const FileViewer = ({ url, title }: { url: string, title: string }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading file for preview:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        setBlobUrl(blobUrl);
        console.log('File loaded successfully for preview');
      } catch (err) {
        console.error('Failed to load file for preview:', err);
        setError('Kunne ikke laste fil for forhåndsvisning');
      } finally {
        setLoading(false);
      }
    };

    React.useEffect(() => {
      loadFile();
      return () => {
        if (blobUrl) {
          window.URL.revokeObjectURL(blobUrl);
        }
      };
    }, [url]);

    if (loading) {
      return <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
    }

    if (error) {
      return <div className="p-4 text-center text-destructive">{error}</div>;
    }

    if (!blobUrl) {
      return <div className="p-4 text-center text-muted-foreground">Ingen fil tilgjengelig</div>;
    }

    // Check if it's a PDF based on the URL or content type
    const isPdf = url.toLowerCase().includes('.pdf') || title.toLowerCase().includes('pdf');
    
    if (isPdf) {
      return (
        <div className="w-full h-[600px] border rounded">
          <iframe
            src={blobUrl}
            className="w-full h-full rounded"
            title={`${title} - Forhåndsvisning`}
          />
        </div>
      );
    }

    // For images
    const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
    if (isImage) {
      return (
        <div className="flex justify-center p-4">
          <img 
            src={blobUrl} 
            alt={title}
            className="max-w-full max-h-[600px] rounded border"
          />
        </div>
      );
    }

    // For other file types, show message
    return (
      <div className="p-8 text-center">
        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          Filtype støttes ikke for forhåndsvisning.<br/>
          Bruk "Last ned"-knappen for å åpne filen.
        </p>
      </div>
    );
  };
  
  const DocumentDisplay = ({
    title,
    documentUrl,
    fallbackText
  }: {
    title: string;
    documentUrl: string | null;
    fallbackText: string;
  }) => {
    const isUrl = documentUrl && documentUrl !== fallbackText && documentUrl.startsWith('http');
    return <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{title}</h4>
          {isUrl && <Badge variant="outline">Dokument vedlagt</Badge>}
        </div>
        
        {isUrl ? <div className="flex items-center gap-2 p-3 border rounded bg-background">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">Dokument tilgjengelig</span>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => setViewingDocument({url: documentUrl, title})}>
                    <Eye className="h-3 w-3 mr-1" />
                    Forhåndsvis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>{title} - Forhåndsvisning</DialogTitle>
                  </DialogHeader>
                  <FileViewer url={documentUrl} title={title} />
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" onClick={async () => {
            try {
              console.log('Downloading file from URL:', documentUrl);
              
              // Fetch the file data
              const response = await fetch(documentUrl);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              // Get the blob data
              const blob = await response.blob();
              
              // Extract filename from URL or use title
              const urlParts = documentUrl.split('/');
              const urlFilename = decodeURIComponent(urlParts[urlParts.length - 1]);
              const filename = urlFilename || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
              
              // Create download link
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              
              // Cleanup
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              
              console.log('File downloaded successfully:', filename);
            } catch (error) {
              console.error('Download failed:', error);
            }
          }}>
                <Download className="h-3 w-3 mr-1" />
                Last ned
              </Button>
            </div>
          </div> : <div className="p-3 border rounded bg-muted/30">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{fallbackText}</span>
            </div>
          </div>}
      </div>;
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Tekniske dokumenter
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Dokumenter fra det valgte konseptet
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <DocumentDisplay title="Tech Spec" documentUrl={techSpec} fallbackText="Ikke lagt ved dokument" />
        
        <DocumentDisplay title="Hospitality Rider" documentUrl={hospitalityRider} fallbackText="Ikke lagt ved dokument" />
      </CardContent>
    </Card>;
};