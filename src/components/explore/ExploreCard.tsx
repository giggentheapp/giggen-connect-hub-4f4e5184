import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, MapPin, User, Music, Users, Building } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

export type ExploreCardType = 'event' | 'musician' | 'band' | 'organizer';

interface ExploreCardImage {
  url: string;
  alt?: string;
}

interface ExploreCardBadge {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  color?: 'green' | 'orange' | 'blue' | 'purple' | 'red';
}

export interface ExploreCardProps {
  id: string;
  type: ExploreCardType;
  title: string;
  subtitle?: string;
  description?: string;
  images?: ExploreCardImage[];
  avatarUrl?: string;
  badges?: ExploreCardBadge[];
  topBadge?: ExploreCardBadge;
  metaItems?: Array<{
    icon: 'calendar' | 'location' | 'users' | 'music';
    text: string;
  }>;
  price?: string | number;
  onClick?: () => void;
}

const getIconComponent = (icon: string) => {
  switch (icon) {
    case 'calendar': return Calendar;
    case 'location': return MapPin;
    case 'users': return Users;
    case 'music': return Music;
    default: return MapPin;
  }
};

const getTypeIcon = (type: ExploreCardType) => {
  switch (type) {
    case 'event': return Calendar;
    case 'musician': return User;
    case 'band': return Users;
    case 'organizer': return Building;
    default: return User;
  }
};

const getBadgeColorClass = (color?: string) => {
  switch (color) {
    case 'green': return 'bg-green-500/90 text-white border-green-500';
    case 'orange': return 'bg-orange-500/90 text-white border-orange-500';
    case 'blue': return 'bg-blue-500/90 text-white border-blue-500';
    case 'purple': return 'bg-purple-500/90 text-white border-purple-500';
    case 'red': return 'bg-red-500/90 text-white border-red-500';
    default: return '';
  }
};

export const ExploreCard = ({
  id,
  type,
  title,
  subtitle,
  description,
  images = [],
  avatarUrl,
  badges = [],
  topBadge,
  metaItems = [],
  price,
  onClick,
}: ExploreCardProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, skipSnaps: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasImages = images.length > 0;
  const TypeIcon = getTypeIcon(type);

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

  return (
    <motion.article
      className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Section */}
      {hasImages ? (
        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
          <div className="embla w-full h-full" ref={emblaRef}>
            <div className="embla__container h-full flex">
              {images.map((image, index) => (
                <div 
                  key={index} 
                  className="embla__slide flex-[0_0_100%] min-w-0 relative"
                >
                  <img
                    src={image.url}
                    alt={image.alt || title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Top Badge Overlay */}
          {topBadge && (
            <motion.div 
              className="absolute top-3 left-3 z-10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Badge 
                className={`text-xs font-bold px-2.5 py-1 shadow-md ${
                  topBadge.color ? getBadgeColorClass(topBadge.color) : ''
                }`}
                variant={topBadge.variant || 'default'}
              >
                {topBadge.label}
              </Badge>
            </motion.div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && isHovered && (
            <>
              {canScrollPrev && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={scrollPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/95 hover:bg-background flex items-center justify-center shadow-lg z-10 transition-transform hover:scale-110"
                  aria-label="Forrige bilde"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
              )}
              {canScrollNext && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={scrollNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/95 hover:bg-background flex items-center justify-center shadow-lg z-10 transition-transform hover:scale-110"
                  aria-label="Neste bilde"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-medium z-10">
              {selectedIndex + 1}/{images.length}
            </div>
          )}

          {/* Dot Indicators */}
          {images.length > 1 && images.length <= 5 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => scrollTo(index, e)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === selectedIndex 
                      ? 'bg-white w-4' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Gå til bilde ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Fallback when no images */
        <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <TypeIcon className="w-12 h-12 text-muted-foreground/30" />
          )}
          
          {/* Top Badge Overlay for no-image cards */}
          {topBadge && (
            <motion.div 
              className="absolute top-3 left-3 z-10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Badge 
                className={`text-xs font-bold px-2.5 py-1 shadow-md ${
                  topBadge.color ? getBadgeColorClass(topBadge.color) : ''
                }`}
                variant={topBadge.variant || 'default'}
              >
                {topBadge.label}
              </Badge>
            </motion.div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-3 space-y-2">
        {/* Badges Row */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge, index) => (
              <Badge 
                key={index}
                variant={badge.variant || 'secondary'}
                className={`text-[10px] px-2 py-0.5 ${
                  badge.color ? getBadgeColorClass(badge.color) : ''
                }`}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-bold text-base leading-tight line-clamp-2 text-foreground">
          {title}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Meta Items */}
        {metaItems.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
            {metaItems.map((item, index) => {
              const IconComponent = getIconComponent(item.icon);
              return (
                <div 
                  key={index}
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <IconComponent className="w-3 h-3 shrink-0" />
                  <span className="truncate">{item.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Price */}
        {price !== undefined && (
          <div className="flex items-center justify-end pt-1">
            <span className="text-sm font-bold text-foreground">
              {typeof price === 'number' ? `${price} kr` : price}
            </span>
          </div>
        )}
      </div>
    </motion.article>
  );
};
