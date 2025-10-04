import { useEffect, useRef } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { logger } from '@/utils/logger';

interface ContactInfoSharingDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ContactInfoSharingDialog = ({ isOpen, onConfirm, onCancel }: ContactInfoSharingDialogProps) => {
  const renderCountRef = useRef(0);
  const isProcessingRef = useRef(false);
  
  useEffect(() => {
    renderCountRef.current += 1;
    logger.debug(`ContactInfoSharingDialog render #${renderCountRef.current}`, { isOpen });
    
    if (renderCountRef.current > 5) {
      logger.warn('⚠️ Too many renders detected in ContactInfoSharingDialog');
    }
  }, [isOpen]);
  
  const handleConfirm = () => {
    if (isProcessingRef.current) {
      logger.warn('Already processing confirm');
      return;
    }
    
    isProcessingRef.current = true;
    logger.info('Contact dialog confirmed');
    onConfirm();
    
    // Reset after a delay
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1000);
  };
  
  const handleCancel = () => {
    if (isProcessingRef.current) {
      logger.warn('Already processing cancel');
      return;
    }
    
    isProcessingRef.current = true;
    logger.info('Contact dialog cancelled');
    onCancel();
    
    // Reset after a delay
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1000);
  };
  
  return (
    <AlertDialog open={isOpen}>
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