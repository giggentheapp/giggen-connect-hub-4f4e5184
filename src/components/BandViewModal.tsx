import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Band } from '@/types/band';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Music, Users, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialMediaLinks } from './SocialMediaLinks';

interface BandViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  band: Band;
}

export const BandViewModal = ({ open, onOpenChange, band }: BandViewModalProps) => {
  const hasMusicLinks = band.music_links && Object.values(band.music_links).some(link => link);
  const hasSocialLinks = band.social_media_links && Object.values(band.social_media_links).some(link => link);
  const hasDiscography = band.discography && band.discography.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Banner */}
        {band.banner_url && (
          <div className="w-full h-48 overflow-hidden">
            <img 
              src={band.banner_url} 
              alt={`${band.name} banner`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={band.image_url || undefined} />
              <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                {band.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold">{band.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {band.genre && (
                  <Badge variant="secondary">
                    <Music className="h-3 w-3 mr-1" />
                    {band.genre}
                  </Badge>
                )}
                {band.founded_year && (
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    Dannet {band.founded_year}
                  </Badge>
                )}
              </div>
              {band.description && (
                <p className="mt-3 text-muted-foreground">{band.description}</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${[true, hasMusicLinks, hasDiscography, hasSocialLinks].filter(Boolean).length}, 1fr)` }}>
              <TabsTrigger value="about">Om bandet</TabsTrigger>
              {hasMusicLinks && <TabsTrigger value="music">Musikk</TabsTrigger>}
              {hasDiscography && <TabsTrigger value="discography">Diskografi</TabsTrigger>}
              {hasSocialLinks && <TabsTrigger value="social">Sosiale medier</TabsTrigger>}
            </TabsList>

            <TabsContent value="about" className="space-y-4 mt-4">
              {band.bio ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Biografi</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{band.bio}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Ingen biografi tilgjengelig</p>
              )}
            </TabsContent>

            {hasMusicLinks && (
              <TabsContent value="music" className="space-y-3 mt-4">
                {band.music_links?.spotify && (
                  <a 
                    href={band.music_links.spotify} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">Spotify</span>
                    </div>
                  </a>
                )}
                {band.music_links?.youtube && (
                  <a 
                    href={band.music_links.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">YouTube</span>
                    </div>
                  </a>
                )}
                {band.music_links?.soundcloud && (
                  <a 
                    href={band.music_links.soundcloud} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">SoundCloud</span>
                    </div>
                  </a>
                )}
                {band.music_links?.appleMusic && (
                  <a 
                    href={band.music_links.appleMusic} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">Apple Music</span>
                    </div>
                  </a>
                )}
                {band.music_links?.bandcamp && (
                  <a 
                    href={band.music_links.bandcamp} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">Bandcamp</span>
                    </div>
                  </a>
                )}
              </TabsContent>
            )}

            {hasDiscography && (
              <TabsContent value="discography" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {band.discography?.map((item, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {item}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            )}

            {hasSocialLinks && (
              <TabsContent value="social" className="mt-4">
                <SocialMediaLinks socialLinks={band.social_media_links || {}} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
