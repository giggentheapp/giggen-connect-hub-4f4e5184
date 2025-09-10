import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  if (!isVisible) {
    return;
  }
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
              <Button size="sm" variant="outline" onClick={() => window.open(documentUrl, '_blank')}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Åpne
              </Button>
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
              // Fallback to direct window.open
              window.open(documentUrl, '_blank');
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