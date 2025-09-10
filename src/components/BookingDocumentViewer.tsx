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
  if (!isVisible) {
    return;
  }

  const FileViewer = ({ url, title }: { url: string, title: string }) => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'pdf' | 'image' | 'text' | 'other'>('other');

    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading file for preview via proxy:', url);
        
        // Extract file path from Supabase URL for proxy
        const getProxyUrl = (originalUrl: string) => {
          try {
            const urlObj = new URL(originalUrl);
            const pathParts = urlObj.pathname.split('/');
            
            // Find bucket and file path from Supabase storage URL
            // URL format: /storage/v1/object/public/{bucket}/{path}
            const bucketIndex = pathParts.findIndex(part => part === 'public') + 1;
            if (bucketIndex > 0 && bucketIndex < pathParts.length) {
              const bucket = pathParts[bucketIndex];
              const filePath = pathParts.slice(bucketIndex + 1).join('/');
              
              // Use our proxy endpoint
              const proxyUrl = `https://hkcdyqghfqyrlwjcsrnx.supabase.co/functions/v1/serve-file?bucket=${bucket}&path=${encodeURIComponent(filePath)}`;
              console.log('Proxy URL:', proxyUrl);
              return proxyUrl;
            }
          } catch (e) {
            console.error('Failed to parse URL for proxy:', e);
          }
          return originalUrl; // Fallback to original URL
        };

        const proxyUrl = getProxyUrl(url);
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('Blob loaded via proxy:', blob.type, blob.size);
        
        // Determine file type
        const isPdf = url.toLowerCase().includes('.pdf') || blob.type === 'application/pdf';
        const isImage = blob.type.startsWith('image/') || url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
        const isText = blob.type.startsWith('text/') || url.toLowerCase().match(/\.(txt|md|json)$/);
        
        if (isPdf) {
          setFileType('pdf');
          // For PDFs, convert the response to blob URL to avoid Chrome blocking
          const blobUrl = URL.createObjectURL(blob);
          setContent(blobUrl);
          console.log('PDF blob URL created from proxy:', blobUrl);
          console.log('Original proxy URL was:', proxyUrl);
        } else if (isImage) {
          setFileType('image');
          // For images, convert to base64 to avoid Chrome blocking
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            setContent(base64);
            console.log('Image converted to base64, length:', base64.length);
          };
          reader.readAsDataURL(blob);
          return; // Exit early since FileReader is async
        } else if (isText) {
          setFileType('text');
          // For text files, read as text
          const text = await blob.text();
          setContent(text);
          console.log('Text content loaded, length:', text.length);
        } else {
          setFileType('other');
          console.log('Unsupported file type for preview:', blob.type);
        }
        
      } catch (err) {
        console.error('Failed to load file for preview:', err);
        setError('Kunne ikke laste fil for forhåndsvisning: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    React.useEffect(() => {
      loadFile();
      return () => {
        // Cleanup blob URLs when component unmounts
        if (content && (content.startsWith('blob:') || content.startsWith('data:'))) {
          if (content.startsWith('blob:')) {
            URL.revokeObjectURL(content);
            console.log('Blob URL cleaned up:', content);
          }
        }
      };
    }, [url]);

    if (loading) {
      return <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-muted-foreground">Laster fil for forhåndsvisning...</p>
      </div>;
    }

    if (error) {
      return <div className="p-8 text-center space-y-4">
        <div className="text-destructive font-medium">Kunne ikke laste fil</div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button 
          size="lg"
          onClick={async () => {
            try {
              // Use proxy URL for download
              const getProxyUrl = (originalUrl: string) => {
                try {
                  const urlObj = new URL(originalUrl);
                  const pathParts = urlObj.pathname.split('/');
                  const bucketIndex = pathParts.findIndex(part => part === 'public') + 1;
                  if (bucketIndex > 0 && bucketIndex < pathParts.length) {
                    const bucket = pathParts[bucketIndex];
                    const filePath = pathParts.slice(bucketIndex + 1).join('/');
                    return `https://hkcdyqghfqyrlwjcsrnx.supabase.co/functions/v1/serve-file?bucket=${bucket}&path=${encodeURIComponent(filePath)}`;
                  }
                } catch (e) {
                  console.error('Failed to parse URL for download:', e);
                }
                return originalUrl;
              };

              const proxyUrl = getProxyUrl(url);
              const response = await fetch(proxyUrl);
              const blob = await response.blob();
              const urlParts = url.split('/');
              const filename = decodeURIComponent(urlParts[urlParts.length - 1]);
              
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(downloadUrl);
            } catch (error) {
              console.error('Download failed:', error);
            }
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Prøv å laste ned likevel
        </Button>
      </div>;
    }

    if (!content) {
      return <div className="p-4 text-center text-muted-foreground">Ingen innhold tilgjengelig</div>;
    }

    switch (fileType) {
      case 'pdf':
        return (
          <div className="w-full">
            <div className="bg-muted/50 p-3 text-sm text-center mb-4 rounded">
              📄 PDF-dokument - {title}
              <div className="text-xs mt-1">
                URL type: {content?.startsWith('blob:') ? 'Blob URL (sikker)' : content?.startsWith('https://hkcdyqghfqyrlwjcsrnx.supabase.co/functions/') ? 'Proxy URL' : 'Direct URL'}
              </div>
            </div>
            <div className="w-full h-[600px] border rounded overflow-hidden">
              {content && content.startsWith('blob:') ? (
                <iframe
                  src={content}
                  className="w-full h-full rounded"
                  title={`${title} - PDF Preview`}
                  onLoad={() => console.log('PDF iframe loaded successfully with blob URL:', content)}
                  onError={(e) => console.error('PDF iframe failed to load:', e, content)}
                />
              ) : (
                <object
                  data={content}
                  type="application/pdf"
                  className="w-full h-full"
                  onLoad={() => console.log('PDF object loaded with URL:', content)}
                >
                  <div className="p-8 text-center space-y-4">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div className="space-y-2">
                      <h4 className="font-medium">PDF kan ikke vises i nettleseren</h4>
                      <p className="text-sm text-muted-foreground">
                        Last ned filen for å åpne den i din PDF-leser
                      </p>
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        Debug: {content?.substring(0, 80)}...
                      </p>
                    </div>
                    <Button 
                      size="lg" 
                      className="mt-4"
                      onClick={async () => {
                        try {
                          // Use proxy URL for download too
                          const getProxyUrl = (originalUrl: string) => {
                            try {
                              const urlObj = new URL(originalUrl);
                              const pathParts = urlObj.pathname.split('/');
                              const bucketIndex = pathParts.findIndex(part => part === 'public') + 1;
                              if (bucketIndex > 0 && bucketIndex < pathParts.length) {
                                const bucket = pathParts[bucketIndex];
                                const filePath = pathParts.slice(bucketIndex + 1).join('/');
                                return `https://hkcdyqghfqyrlwjcsrnx.supabase.co/functions/v1/serve-file?bucket=${bucket}&path=${encodeURIComponent(filePath)}`;
                              }
                            } catch (e) {
                              console.error('Failed to parse URL for download:', e);
                            }
                            return originalUrl;
                          };

                          const proxyUrl = getProxyUrl(url);
                          const response = await fetch(proxyUrl);
                          const blob = await response.blob();
                          const urlParts = url.split('/');
                          const filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                          
                          const downloadUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = downloadUrl;
                          link.download = filename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(downloadUrl);
                        } catch (error) {
                          console.error('Download failed:', error);
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Last ned PDF
                    </Button>
                  </div>
                </object>
              )}
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="flex flex-col items-center p-4">
            <div className="bg-muted/50 p-3 text-sm text-center mb-4 rounded w-full">
              🖼️ Bilde - {title}
            </div>
            <img 
              src={content} 
              alt={title}
              className="max-w-full max-h-[600px] rounded border shadow-sm"
              onError={() => setError('Kunne ikke laste bildet')}
            />
          </div>
        );
      
      case 'text':
        return (
          <div className="w-full">
            <div className="bg-muted/50 p-3 text-sm text-center mb-4 rounded">
              📝 Tekstfil - {title}
            </div>
            <div className="border rounded p-4 bg-background max-h-[600px] overflow-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">{content}</pre>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-8 text-center space-y-4">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h4 className="font-medium">{title}</h4>
              <p className="text-sm text-muted-foreground">
                Filtype støttes ikke for forhåndsvisning
              </p>
            </div>
            <Button 
              size="lg"
          onClick={async () => {
            try {
              // Use proxy URL for download
              const getProxyUrl = (originalUrl: string) => {
                try {
                  const urlObj = new URL(originalUrl);
                  const pathParts = urlObj.pathname.split('/');
                  const bucketIndex = pathParts.findIndex(part => part === 'public') + 1;
                  if (bucketIndex > 0 && bucketIndex < pathParts.length) {
                    const bucket = pathParts[bucketIndex];
                    const filePath = pathParts.slice(bucketIndex + 1).join('/');
                    return `https://hkcdyqghfqyrlwjcsrnx.supabase.co/functions/v1/serve-file?bucket=${bucket}&path=${encodeURIComponent(filePath)}`;
                  }
                } catch (e) {
                  console.error('Failed to parse URL for download:', e);
                }
                return originalUrl;
              };

              const proxyUrl = getProxyUrl(url);
              const response = await fetch(proxyUrl);
              const blob = await response.blob();
              const urlParts = url.split('/');
              const filename = decodeURIComponent(urlParts[urlParts.length - 1]);
              
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(downloadUrl);
            } catch (error) {
              console.error('Download failed:', error);
            }
          }}
            >
              <Download className="h-4 w-4 mr-2" />
              Last ned fil
            </Button>
          </div>
        );
    }
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
    
    const handlePreviewClick = () => {
      console.log('Preview button clicked for:', title, documentUrl);
    };
    
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
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handlePreviewClick}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Forhåndsvis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>📄 {title}</DialogTitle>
                  </DialogHeader>
                  <FileViewer url={documentUrl} title={title} />
                </DialogContent>
              </Dialog>
              <Button 
                size="sm" 
                onClick={async () => {
                  try {
                    console.log('Downloading file from URL via proxy:', documentUrl);
                    
                    // Use proxy URL for download
                    const getProxyUrl = (originalUrl: string) => {
                      try {
                        const urlObj = new URL(originalUrl);
                        const pathParts = urlObj.pathname.split('/');
                        const bucketIndex = pathParts.findIndex(part => part === 'public') + 1;
                        if (bucketIndex > 0 && bucketIndex < pathParts.length) {
                          const bucket = pathParts[bucketIndex];
                          const filePath = pathParts.slice(bucketIndex + 1).join('/');
                          return `https://hkcdyqghfqyrlwjcsrnx.supabase.co/functions/v1/serve-file?bucket=${bucket}&path=${encodeURIComponent(filePath)}`;
                        }
                      } catch (e) {
                        console.error('Failed to parse URL for download:', e);
                      }
                      return originalUrl;
                    };

                    const proxyUrl = getProxyUrl(documentUrl);
                    const response = await fetch(proxyUrl);
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
                    
                    console.log('File downloaded successfully via proxy:', filename);
                  } catch (error) {
                    console.error('Download failed:', error);
                  }
                }}
              >
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