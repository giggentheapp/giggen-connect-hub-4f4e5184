import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ContactInfoSharingDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ContactInfoSharingDialog = ({ isOpen, onConfirm, onCancel }: ContactInfoSharingDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Del kontaktinformasjon</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Ved å sende denne forespørselen godtar du at kontaktinformasjonen din blir delt med mottaker dersom forespørselen blir godtatt.
            </p>
            <p className="text-sm font-medium">
              Dette inkluderer: Navn, e-post og eventuell telefon/adresse du har registrert.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Avbryt</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Godta og send forespørsel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};