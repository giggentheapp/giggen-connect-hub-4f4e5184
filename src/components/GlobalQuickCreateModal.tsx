import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, BriefcaseIcon, Users, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GlobalQuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilbankUpload: () => void;
  userId: string;
}

export const GlobalQuickCreateModal = ({ 
  open, 
  onOpenChange, 
  onFilbankUpload,
  userId
}: GlobalQuickCreateModalProps) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'event',
      icon: Calendar,
      label: 'Opprett nytt arrangement',
      description: 'Lag et nytt arrangement',
      onClick: () => {
        navigate('/create-event');
        onOpenChange(false);
      },
    },
    {
      id: 'offer',
      icon: BriefcaseIcon,
      label: 'Opprett nytt tilbud',
      description: 'Lag et nytt tilbud',
      onClick: () => {
        navigate('/create-offer');
        onOpenChange(false);
      },
    },
    {
      id: 'band',
      icon: Users,
      label: 'Opprett nytt band',
      description: 'Lag et nytt band',
      onClick: () => {
        navigate('/band/new');
        onOpenChange(false);
      },
    },
    {
      id: 'filbank',
      icon: Upload,
      label: 'Last opp til Filbank',
      description: 'Last opp filer til Filbank',
      onClick: () => {
        onFilbankUpload();
        onOpenChange(false);
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl p-6 space-y-4 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Hva vil du opprette?</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={action.onClick}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/60 transition"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
