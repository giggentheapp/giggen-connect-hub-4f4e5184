import { Button } from '@/components/ui/button';
import { Edit, X } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { UserConcept } from '@/types/concept';

interface DraftOfferCardProps {
  draft: UserConcept;
  onContinue: () => void;
  onDelete: () => void;
  calculateProgress: (draft: UserConcept) => { completed: number; total: number };
}

export const DraftOfferCard = ({ 
  draft, 
  onContinue, 
  onDelete, 
  calculateProgress 
}: DraftOfferCardProps) => {
  const progress = calculateProgress(draft);

  return (
    <div className="rounded-lg border border-border/40 bg-gradient-to-br from-background to-muted/20 p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">
              {draft.title || 'Nytt tilbud'}
            </h4>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
              draft.concept_type === 'teaching' 
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            )}>
              {draft.concept_type === 'teaching' ? '📚 Undervisning' : '🎵 Session'}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Sist endret: {format(new Date(draft.updated_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-orange transition-all"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {progress.completed}/{progress.total}
            </span>
          </div>
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
