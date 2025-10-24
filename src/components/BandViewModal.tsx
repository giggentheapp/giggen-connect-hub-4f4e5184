import { useState, useEffect } from 'react';
import { Band } from '@/types/band';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, Calendar, Mail, Phone, X, FileText, ExternalLink, Info, Disc, Share2, Settings, Beer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialMediaLinks } from './SocialMediaLinks';
import { supabase } from '@/integrations/supabase/client';

interface BandViewModalProps {
  open: boolean;
  onClose: () => void;
  band: Band;
  showContactInfo?: boolean;
}

export const BandViewModal = ({ open, onClose, band, showContactInfo = false }: BandViewModalProps) => {
  const [techSpecs, setTechSpecs] = useState<any[]>([]);
  const [hospitalityRiders, setHospitalityRiders] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!band.id) return;
      
      try {
        const [techSpecsRes, hospitalityRes] = await Promise.all([
          supabase
            .from('band_tech_specs')
            .select('*')
            .eq('band_id', band.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('band_hospitality')
            .select('*')
            .eq('band_id', band.id)
            .order('created_at', { ascending: false })
        ]);

        if (techSpecsRes.data) setTechSpecs(techSpecsRes.data);
        if (hospitalityRes.data) setHospitalityRiders(hospitalityRes.data);
      } catch (error) {
        console.error('Error fetching band files:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    if (open) {
      fetchFiles();
    }
  }, [band.id, open]);

  // When showContactInfo is true (admin), show all tabs even if empty
  // When false (public), only show tabs with data
  const hasMusicLinks = showContactInfo || (band.music_links && Object.values(band.music_links).some(link => link));
  const hasSocialLinks = showContactInfo || (band.social_media_links && Object.values(band.social_media_links).some(link => link));
  const hasDiscography = showContactInfo || (band.discography && band.discography.length > 0);
  const hasContactInfo = showContactInfo;
  const hasTechSpecs = showContactInfo || techSpecs.length > 0;
  const hasHospitality = showContactInfo || hospitalityRiders.length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="min-h-screen">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="fixed top-2 right-2 md:top-4 md:right-4 z-10"
        >
          <X className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
        {/* Banner */}
        {band.banner_url && (
          <div className="w-full h-48 md:h-64 lg:h-96 overflow-hidden">
            <img 
              src={band.banner_url} 
              alt={`${band.name} banner`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 mx-auto sm:mx-0">
              <AvatarImage src={band.image_url || undefined} />
              <AvatarFallback className="text-xl md:text-2xl bg-gradient-primary text-primary-foreground">
                {band.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl md:text-3xl font-bold">{band.name}</h2>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                {band.genre && (
                  <Badge variant="secondary" className="text-xs md:text-sm">
                    <Music className="h-3 w-3 mr-1" />
                    {band.genre}
                  </Badge>
                )}
                {band.founded_year && (
                  <Badge variant="outline" className="text-xs md:text-sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    Dannet {band.founded_year}
                  </Badge>
                )}
              </div>
              {band.description && (
                <p className="mt-3 text-sm md:text-base text-muted-foreground">{band.description}</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full h-auto" style={{ gridTemplateColumns: `repeat(${[true, hasMusicLinks, hasDiscography, hasSocialLinks, hasTechSpecs, hasHospitality, hasContactInfo].filter(Boolean).length}, 1fr)` }}>
              <TabsTrigger value="about" className="flex-col gap-1 py-2" title="Om bandet">
                <Info className="h-5 w-5" />
                <span className="text-xs hidden md:inline">Om</span>
              </TabsTrigger>
              {hasMusicLinks && (
                <TabsTrigger value="music" className="flex-col gap-1 py-2" title="Musikk">
                  <Music className="h-5 w-5" />
                  <span className="text-xs hidden md:inline">Musikk</span>
                </TabsTrigger>
              )}
              {hasDiscography && (
                <TabsTrigger value="discography" className="flex-col gap-1 py-2" title="Diskografi">
                  <Disc className="h-5 w-5" />
                  <span className="text-xs hidden md:inline">Diskografi</span>
                </TabsTrigger>
              )}
              {hasSocialLinks && (
                <TabsTrigger value="social" className="flex-col gap-1 py-2" title="Sosiale medier">
                  <Share2 className="h-5 w-5" />
                  <span className="text-xs hidden md:inline">Sosiale</span>
                </TabsTrigger>
              )}
              {hasTechSpecs && (
                <TabsTrigger value="techspecs" className="flex-col gap-1 py-2" title="Tech Specs">
                  <Settings className="h-5 w-5" />
                  <span className="text-xs hidden md:inline">Tech</span>
                </TabsTrigger>
              )}
              {hasHospitality && (
                <TabsTrigger value="hospitality" className="flex-col gap-1 py-2" title="Hospitality">
                  <Beer className="h-5 w-5" />
                  <span className="text-xs hidden md:inline">Hospitality</span>
                </TabsTrigger>
              )}
              {hasContactInfo && (
                <TabsTrigger value="contact" className="flex-col gap-1 py-2" title="Kontakt">
                  <Mail className="h-5 w-5" />
                  <span className="text-xs hidden md:inline">Kontakt</span>
                </TabsTrigger>
              )}
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
                {band.music_links?.spotify ? (
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
                ) : showContactInfo && (
                  <div className="p-3 border rounded-lg opacity-50">
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">Spotify - ikke lagt til</span>
                    </div>
                  </div>
                )}
                {band.music_links?.youtube ? (
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
                ) : showContactInfo && (
                  <div className="p-3 border rounded-lg opacity-50">
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">YouTube - ikke lagt til</span>
                    </div>
                  </div>
                )}
                {band.music_links?.soundcloud ? (
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
                ) : showContactInfo && (
                  <div className="p-3 border rounded-lg opacity-50">
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">SoundCloud - ikke lagt til</span>
                    </div>
                  </div>
                )}
                {band.music_links?.appleMusic ? (
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
                ) : showContactInfo && (
                  <div className="p-3 border rounded-lg opacity-50">
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">Apple Music - ikke lagt til</span>
                    </div>
                  </div>
                )}
                {band.music_links?.bandcamp ? (
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
                ) : showContactInfo && (
                  <div className="p-3 border rounded-lg opacity-50">
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">Bandcamp - ikke lagt til</span>
                    </div>
                  </div>
                )}
                {!band.music_links?.spotify && !band.music_links?.youtube && 
                 !band.music_links?.soundcloud && !band.music_links?.appleMusic && 
                 !band.music_links?.bandcamp && !showContactInfo && (
                  <p className="text-muted-foreground text-center py-8">Ingen musikklenker tilgjengelig</p>
                )}
              </TabsContent>
            )}

            {hasDiscography && (
              <TabsContent value="discography" className="mt-4">
                {band.discography && band.discography.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {band.discography.map((item, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {showContactInfo ? 'Ingen diskografi lagt til ennå' : 'Ingen diskografi tilgjengelig'}
                  </p>
                )}
              </TabsContent>
            )}

            {hasSocialLinks && (
              <TabsContent value="social" className="mt-4">
                {band.social_media_links && Object.values(band.social_media_links).some(link => link) ? (
                  <SocialMediaLinks socialLinks={band.social_media_links} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {showContactInfo ? 'Ingen sosiale medier lagt til ennå' : 'Ingen sosiale medier tilgjengelig'}
                  </p>
                )}
              </TabsContent>
            )}

            {hasTechSpecs && (
              <TabsContent value="techspecs" className="space-y-3 mt-4">
                {loadingFiles ? (
                  <p className="text-center text-muted-foreground py-4">Laster...</p>
                ) : techSpecs.length > 0 ? (
                  <div className="space-y-2">
                    {techSpecs.map((spec) => (
                      <a
                        key={spec.id}
                        href={spec.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-lg hover:border-primary transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-accent-purple" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{spec.filename}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {spec.file_type} • {new Date(spec.created_at).toLocaleDateString('no-NO')}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {showContactInfo ? 'Ingen tech spec-filer lagt til ennå' : 'Ingen tech specs tilgjengelig'}
                  </p>
                )}
              </TabsContent>
            )}

            {hasHospitality && (
              <TabsContent value="hospitality" className="space-y-3 mt-4">
                {loadingFiles ? (
                  <p className="text-center text-muted-foreground py-4">Laster...</p>
                ) : hospitalityRiders.length > 0 ? (
                  <div className="space-y-2">
                    {hospitalityRiders.map((rider) => (
                      <a
                        key={rider.id}
                        href={rider.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-lg hover:border-primary transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-accent-pink/20 to-accent-orange/20 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-accent-pink" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{rider.filename}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {rider.file_type} • {new Date(rider.created_at).toLocaleDateString('no-NO')}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {showContactInfo ? 'Ingen hospitality-filer lagt til ennå' : 'Ingen hospitality riders tilgjengelig'}
                  </p>
                )}
              </TabsContent>
            )}

            {hasContactInfo && (
              <TabsContent value="contact" className="space-y-3 mt-4">
                {band.contact_info?.email ? (
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">E-post</span>
                    </div>
                    <a href={`mailto:${band.contact_info.email}`} className="text-primary hover:underline">
                      {band.contact_info.email}
                    </a>
                  </div>
                ) : (
                  <div className="p-3 border rounded-lg opacity-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">E-post - ikke lagt til</span>
                    </div>
                  </div>
                )}
                {band.contact_info?.phone ? (
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Telefon</span>
                    </div>
                    <a href={`tel:${band.contact_info.phone}`} className="text-primary hover:underline">
                      {band.contact_info.phone}
                    </a>
                  </div>
                ) : (
                  <div className="p-3 border rounded-lg opacity-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Telefon - ikke lagt til</span>
                    </div>
                  </div>
                )}
                {band.contact_info?.booking_email ? (
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Booking e-post</span>
                    </div>
                    <a href={`mailto:${band.contact_info.booking_email}`} className="text-primary hover:underline">
                      {band.contact_info.booking_email}
                    </a>
                  </div>
                ) : (
                  <div className="p-3 border rounded-lg opacity-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Booking e-post - ikke lagt til</span>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};
