import { FileText, Download } from 'lucide-react';
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
    return null;
  }

  // Simplified document display - disable heavy file preview on mobile/Safari
  const isMobileOrSafari = () => {
    if (typeof window === 'undefined') return false;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    return isMobile || isSafari;
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
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{title}</h4>
          {isUrl && <Badge variant="outline">Dokument vedlagt</Badge>}
        </div>
        
        {isUrl ? (
          <div className="flex items-center gap-2 p-3 border rounded bg-background">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">Dokument tilgjengelig</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => {
                  // Simple download without preview on mobile/Safari
                  if (isMobileOrSafari()) {
                    window.open(documentUrl, '_blank');
                  } else {
                    // Desktop can handle download
                    const link = document.createElement('a');
                    link.href = documentUrl;
                    link.download = title;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
              >
                <Download className="h-3 w-3 mr-1" />
                {isMobileOrSafari() ? 'Åpne' : 'Last ned'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3 border rounded bg-muted/50">
            <p className="text-sm text-muted-foreground">{fallbackText}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
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
        <DocumentDisplay 
          title="Tekniske spesifikasjoner" 
          documentUrl={techSpec} 
          fallbackText="Ikke lagt ved dokument" 
        />
        
        <DocumentDisplay 
          title="Hospitality Rider" 
          documentUrl={hospitalityRider} 
          fallbackText="Ikke lagt ved dokument" 
        />
      </CardContent>
    </Card>
  );
};