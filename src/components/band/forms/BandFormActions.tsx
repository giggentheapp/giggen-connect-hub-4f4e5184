import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, Trash2 } from 'lucide-react';

interface DeleteProps {
  bandName: string;
  confirmation: string;
  onConfirmationChange: (value: string) => void;
  onDelete: () => Promise<boolean>;
  isDeleting: boolean;
  canDelete: boolean;
}

interface BandFormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel: string;
  showDelete?: boolean;
  deleteProps?: DeleteProps;
  isCreateMode?: boolean;
}

export const BandFormActions = ({
  isSubmitting,
  onCancel,
  submitLabel,
  showDelete,
  deleteProps,
  isCreateMode,
}: BandFormActionsProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-0 pt-4 md:pt-6 border-t sticky bottom-0 md:static bg-background/95 backdrop-blur -mx-3 md:mx-0 px-3 md:px-0 py-3 md:py-0 border-t">
      <div className="order-2 md:order-1">
        {showDelete && deleteProps && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" size="sm" className="w-full md:w-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Slett band
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Er du sikker på at du vil slette bandet?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    Dette vil permanent slette bandet "{deleteProps.bandName}" og alle tilknyttede
                    data, inkludert:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Alle medlemskap</li>
                    <li>Portfolio filer</li>
                    <li>Tekniske spesifikasjoner</li>
                    <li>Hospitality riders</li>
                    <li>Invitasjoner</li>
                  </ul>
                  <div className="pt-4">
                    <Label>
                      Skriv <strong>SLETT</strong> for å bekrefte
                    </Label>
                    <Input
                      value={deleteProps.confirmation}
                      onChange={(e) => deleteProps.onConfirmationChange(e.target.value)}
                      placeholder="SLETT"
                      className="mt-2"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => deleteProps.onConfirmationChange('')}>
                  Avbryt
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteProps.onDelete}
                  disabled={!deleteProps.canDelete || deleteProps.isDeleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleteProps.isDeleting ? 'Sletter...' : 'Slett permanent'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <div className="flex gap-2 order-1 md:order-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 md:flex-none"
        >
          Avbryt
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 md:flex-none">
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
              <span className="hidden md:inline">Lagrer...</span>
              <span className="md:hidden">...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">{submitLabel}</span>
              <span className="md:hidden">{isCreateMode ? 'Opprett' : 'Lagre'}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
