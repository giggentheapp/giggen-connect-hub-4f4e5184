import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { useProfileTechSpecs } from '@/hooks/useProfileTechSpecs';

interface ProfileTechSpecsViewerProps {
  userId: string;
  showControls?: boolean;
}

export const ProfileTechSpecsViewer = ({ userId, showControls = false }: ProfileTechSpecsViewerProps) => {
  const { files, loading, error } = useProfileTechSpecs(userId);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Kunne ikke laste tekniske spesifikasjoner: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!files.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {showControls 
              ? "Ingen tekniske spesifikasjoner lastet opp. Gå til innstillinger for å laste opp."
              : "Ingen tekniske spesifikasjoner tilgjengelig"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <Card key={file.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {file.filename}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {file.file_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(file.created_at).toLocaleDateString('no-NO')}
                    </span>
                    {file.file_size && (
                      <span className="text-xs text-muted-foreground">
                        • {(file.file_size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {file.file_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a 
                    href={file.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Last ned
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileTechSpecsViewer;