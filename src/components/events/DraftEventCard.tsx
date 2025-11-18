import { Button } from '@/components/ui/button';
import { Edit, X, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { EventDraft } from '@/hooks/useUserEventDrafts';

interface DraftEventCardProps {
  event: EventDraft;
  onContinue: () => void;
  onDelete: () => void;
}

export const DraftEventCard = ({ event, onContinue, onDelete }: DraftEventCardProps) => {
  const getBannerUrl = () => {
    if (!event.banner_url) return null;
    const path = event.banner_url.includes('supabase.co') 
      ? event.banner_url.split('/filbank/')[1] 
      : event.banner_url;
    
    const { data } = supabase.storage.from('filbank').getPublicUrl(path);
    return data.publicUrl;
  };

  const bannerUrl = getBannerUrl();

  return (
    <div className="rounded-lg border border-border/40 bg-gradient-to-br from-background to-muted/20 p-3">
      <div className="flex items-start gap-3">
        {bannerUrl && (
          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
            <img 
              src={bannerUrl} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">
              {event.title || 'Uten tittel'}
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              📅 Arrangement
            </span>
          </div>

          {event.date && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(event.date), 'dd.MM.yyyy', { locale: nb })}
                {event.start_time && ` ${event.start_time.slice(0, 5)}`}
              </span>
            </div>
          )}

          {event.venue && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}

          {event.created_at && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Sist endret: {format(new Date(event.created_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
            </p>
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={onContinue}
            className="h-7 px-2 text-xs"
          >
            <Edit className="h-3 w-3 mr-1" />
            Fortsett
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-7 w-7 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
