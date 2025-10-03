import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ContactInfoSharingDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ContactInfoSharingDialog = ({ isOpen, onConfirm, onCancel }: ContactInfoSharingDialogProps) => {
  console.log('🔔 ContactInfoSharingDialog render', { isOpen });
  
  const handleConfirm = () => {
    console.log('🟢 ContactInfoSharingDialog - Confirm button clicked');
    onConfirm();
  };
  
  const handleCancel = () => {
    console.log('🔴 ContactInfoSharingDialog - Cancel button clicked');
    onCancel();
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Del kontaktinformasjon</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <div>
                Ved å sende denne forespørselen godtar du at kontaktinformasjonen din blir delt med mottaker dersom forespørselen blir godtatt.
              </div>
              <div className="text-sm font-medium">
                Dette inkluderer: Navn, e-post og eventuell telefon/adresse du har registrert.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Avbryt</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Godta og send forespørsel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};