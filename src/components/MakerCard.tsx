import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapPin, Music, Calendar, Image, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigate } from 'react-router-dom';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { supabase } from '@/integrations/supabase/client';
import useEmblaCarousel from 'embla-carousel-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface MakerCardProps {
  maker: {
    id: string;
    user_id: string;
    display_name: string;
    username: string;
    bio: string | null;
    role: string;
    avatar_url: string | null;
    address: string | null;
    privacy_settings: any;
    created_at: string;
    instruments?: Array<{ instrument: string; details: string }>;
  };
  onViewProfile: (userId: string) => void;
}

export const MakerCard = ({ maker, onViewProfile }: MakerCardProps) => {
  const { t } = useAppTranslation();
  const { files: portfolioFiles, loading: portfolioLoading } = useProfilePortfolio(maker.user_id);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, skipSnaps: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [hoveredImage, setHoveredImage] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  
  const privacySettings = maker.privacy_settings || {};
  const showPortfolio = privacySettings.show_portfolio_to_goers;
  
  // Filter for image files only with valid paths
  const imageFiles = portfolioFiles.filter(file => 
    file?.mime_type?.startsWith('image/') && file?.file_path
  );

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

  const getPublicUrl = (filePath: string | undefined) => {
    if (!filePath) return '';
    try {
      const { data } = supabase.storage.from('user_files').getPublicUrl(filePath);
      return data.publicUrl || '';
    } catch (error) {
      console.error('Error getting public URL:', error);
      return '';
    }
  };

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setModalImageIndex(index);
    setModalOpen(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if not clicking on gallery controls
    if (!(e.target as HTMLElement).closest('.gallery-controls')) {
      onViewProfile(maker.user_id);
    }
  };

  return (
    <>
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick={handleCardClick}
      >
        {/* Portfolio Gallery */}
        {showPortfolio && imageFiles.length > 0 && !portfolioLoading && (
          <div 
            className="relative w-full aspect-[4/3] bg-muted overflow-hidden rounded-t-lg"
            onMouseEnter={() => setHoveredImage(true)}
            onMouseLeave={() => setHoveredImage(false)}
          >
            <div className="embla w-full h-full" ref={emblaRef}>
              <div className="embla__container h-full flex">
                {imageFiles.map((file, index) => {
                  const imageUrl = getPublicUrl(file.file_path);
                  if (!imageUrl) return null;
                  
                  return (
                    <div 
                      key={file.id} 
                      className="embla__slide flex-[0_0_100%] min-w-0 relative"
                      onClick={(e) => handleImageClick(e, index)}
                    >
                      <img
                        src={imageUrl}
                        alt={file.title || file.filename || 'Portfolio image'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-t-lg"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Arrows */}
            {imageFiles.length > 1 && hoveredImage && (
              <div className="gallery-controls">
                {canScrollPrev && (
                  <button
                    onClick={scrollPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg transition-all duration-200 z-10 animate-fade-in"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {canScrollNext && (
                  <button
                    onClick={scrollNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg transition-all duration-200 z-10 animate-fade-in"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Image Counter */}
            {imageFiles.length > 1 && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/90 text-xs font-medium shadow-md z-10">
                {selectedIndex + 1}/{imageFiles.length}
              </div>
            )}

            {/* Dot Indicators */}
            {imageFiles.length > 1 && imageFiles.length <= 5 && (
              <div className="gallery-controls absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {imageFiles.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => scrollTo(index, e)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index === selectedIndex 
                        ? 'bg-background w-4' 
                        : 'bg-background/60 hover:bg-background/80'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {maker.avatar_url ? (
              <img 
                src={maker.avatar_url} 
                alt={maker.display_name || 'Profile'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <User className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1 text-base">{maker.display_name}</CardTitle>
            <CardDescription className="text-xs">@{maker.username}</CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {maker.role === 'musician' || maker.role === 'MUSIKER' ? 'Musiker' : 'Arrangør'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {maker.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{maker.address}</span>
          </div>
        )}

        {maker.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {maker.bio}
          </p>
        )}

        {/* Instruments - Only for Musicians */}
        {maker.role === 'musician' && maker.instruments && maker.instruments.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/50">
            {maker.instruments.slice(0, 3).map((item, index) => (
              <div 
                key={index}
                className="inline-flex flex-col px-2.5 py-1.5 rounded-md bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 border border-accent-orange/20"
              >
                <span className="text-xs font-semibold text-accent-orange leading-none">
                  {item.instrument}
                </span>
                {item.details && (
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {item.details}
                  </span>
                )}
              </div>
            ))}
            {maker.instruments.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{maker.instruments.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Full Image Modal */}
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden rounded-lg">
        <VisuallyHidden>
          <DialogTitle>Portfolio bilde</DialogTitle>
          <DialogDescription>
            {imageFiles[modalImageIndex]?.title || imageFiles[modalImageIndex]?.filename || 'Portfolio bilde'}
          </DialogDescription>
        </VisuallyHidden>
        {imageFiles[modalImageIndex] && (
          <div className="relative w-full aspect-video bg-background rounded-lg overflow-hidden">
            <img
              src={getPublicUrl(imageFiles[modalImageIndex]?.file_path)}
              alt={imageFiles[modalImageIndex]?.title || imageFiles[modalImageIndex]?.filename || 'Portfolio image'}
              className="w-full h-full object-contain rounded-lg"
            />
          
          {/* Modal Navigation */}
          {imageFiles.length > 1 && (
            <>
              <button
                onClick={() => setModalImageIndex((prev) => (prev - 1 + imageFiles.length) % imageFiles.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg transition-all duration-200"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setModalImageIndex((prev) => (prev + 1) % imageFiles.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg transition-all duration-200"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-background/90 text-sm font-medium shadow-md">
                {modalImageIndex + 1} / {imageFiles.length}
              </div>
            </>
          )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};