import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BandWithMembers } from '@/types/band';
import { Users, Music, ChevronLeft, ChevronRight, Play, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BandViewModal } from './BandViewModal';
import { supabase } from '@/integrations/supabase/client';
import useEmblaCarousel from 'embla-carousel-react';

interface BandCardProps {
  band: BandWithMembers;
  userRole?: string;
  portfolioFiles?: any[]; // ✅ NEW: Receive from parent (batched fetch)
  portfolioLoading?: boolean; // ✅ NEW: Loading state from parent
}

export const BandCard = ({ 
  band, 
  userRole,
  portfolioFiles: propsPortfolioFiles,
  portfolioLoading: propsPortfolioLoading = false
}: BandCardProps) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  
  // ✅ Use props from parent (batched fetch) instead of local fetch
  const portfolioFiles = propsPortfolioFiles || [];
  const loading = propsPortfolioLoading;
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, skipSnaps: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [hoveredImage, setHoveredImage] = useState(false);

  // File type detection helpers
  const isImageFile = (file: any) => 
    file.file_type === 'image' || file.mime_type?.startsWith('image/');
  
  const isVideoFile = (file: any) => 
    file.file_type === 'video' || file.mime_type?.startsWith('video/');
  
  const isAudioFile = (file: any) => 
    file.file_type === 'audio' || file.mime_type?.startsWith('audio/');

  const imageFiles = portfolioFiles.filter(isImageFile);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data.publicUrl || '';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'founder':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'founder':
        return 'Grunnlegger';
      case 'admin':
        return 'Admin';
      default:
        return 'Medlem';
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'founder';

  const handleCardClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.gallery-controls')) {
      if (isAdmin) {
        navigate(`/band/${band.id}`, { 
          state: { fromSection: 'explore' } 
        });
      } else {
        setShowModal(true);
      }
    }
  };

  // All media files including banner, in order: banner first, then all portfolio files
  const allMediaFiles = [
    ...(band.banner_url ? [{ 
      type: 'banner' as const, 
      url: band.banner_url, 
      title: 'Banner',
      file: null as any
    }] : []),
    ...portfolioFiles.map(file => ({
      type: isImageFile(file) ? 'image' as const : 
            isVideoFile(file) ? 'video' as const : 
            isAudioFile(file) ? 'audio' as const : 'document' as const,
      url: file.file_path ? getPublicUrl(file.file_path) : file.file_url,
      title: file.title || file.filename,
      file: file
    }))
  ];

  return (
    <>
      <Card
        className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick={handleCardClick}
      >
        {/* Image Gallery - Banner + Portfolio */}
        {allMediaFiles.length > 0 && !loading && (
          <div 
            className="relative w-full aspect-[4/3] bg-muted overflow-hidden rounded-t-lg"
            onMouseEnter={() => setHoveredImage(true)}
            onMouseLeave={() => setHoveredImage(false)}
          >
            <div className="embla w-full h-full" ref={emblaRef}>
              <div className="embla__container h-full flex">
                {allMediaFiles.map((media, index) => (
                  <div 
                    key={index} 
                    className="embla__slide flex-[0_0_100%] min-w-0 relative"
                  >
                    {/* Banner or Image */}
                    {media.type === 'banner' || media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={media.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : media.type === 'video' ? (
                      /* Video thumbnail with play icon */
                      <div className="w-full h-full relative bg-black">
                        <video
                          src={media.url + '#t=0.5'}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-6 h-6 text-black ml-1" fill="black" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-white text-xs font-medium truncate">
                            {media.title}
                          </p>
                        </div>
                      </div>
                    ) : media.type === 'audio' ? (
                      /* Audio file preview */
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-accent-blue/10 to-accent-purple/10">
                        <Music className="w-12 h-12 text-accent-blue mb-2" />
                        <p className="text-sm font-medium text-center px-4 line-clamp-2">
                          {media.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Lydfil</p>
                      </div>
                    ) : (
                      /* Document file preview */
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-accent-purple/10 to-accent-pink/10">
                        <FileText className="w-12 h-12 text-accent-purple mb-2" />
                        <p className="text-sm font-medium text-center px-4 line-clamp-2">
                          {media.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {media.file?.file_type || 'Dokument'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            {allMediaFiles.length > 1 && hoveredImage && (
              <div className="gallery-controls">
                {canScrollPrev && (
                  <button
                    onClick={scrollPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg transition-all duration-200 z-10"
                    aria-label="Forrige"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {canScrollNext && (
                  <button
                    onClick={scrollNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg transition-all duration-200 z-10"
                    aria-label="Neste"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Counter */}
            {allMediaFiles.length > 1 && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/90 text-xs font-medium shadow-md z-10">
                {selectedIndex + 1}/{allMediaFiles.length}
              </div>
            )}

            {/* Dot Indicators */}
            {allMediaFiles.length > 1 && allMediaFiles.length <= 5 && (
              <div className="gallery-controls absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {allMediaFiles.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => scrollTo(index, e)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index === selectedIndex 
                        ? 'bg-background w-4' 
                        : 'bg-background/60 hover:bg-background/80'
                    }`}
                    aria-label={`Gå til ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {band.image_url ? (
              <img 
                src={band.image_url} 
                alt={band.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1 text-base">{band.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              {band.member_count || 0} medlemmer
            </CardDescription>
          </div>
          {userRole && (
            <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs shrink-0">
              {getRoleLabel(userRole)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {band.genre && (
          <Badge variant="secondary" className="text-xs">
            {band.genre}
          </Badge>
        )}
        
        {band.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {band.description}
          </p>
        )}
        
        {band.founded_year && (
          <p className="text-xs text-muted-foreground">
            Dannet: {band.founded_year}
          </p>
        )}
      </CardContent>
    </Card>

    <BandViewModal 
      open={showModal} 
      onClose={() => setShowModal(false)} 
      band={band}
      showContactInfo={isAdmin}
    />
    </>
  );
};
