import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface ConceptActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason?: string) => void;
  onDelete: () => void;
  conceptTitle: string;
  isLoading?: boolean;
}

export const ConceptActionsDialog = ({
  isOpen,
  onClose,
  onReject,
  onDelete,
  conceptTitle,
  isLoading = false
}: ConceptActionsDialogProps) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = () => {
    onReject(rejectionReason);
    setRejectionReason('');
    setShowRejectDialog(false);
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <>
      {/* Main Actions Dialog */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tilbudshandlinger</DialogTitle>
            <DialogDescription>
              Velg en handling for tilbudet "{conceptTitle}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowRejectDialog(true)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Avvis tilbud
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Slett tilbud til historikk
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Avvis tilbud</DialogTitle>
            <DialogDescription>
              Tilbudet vil bli flyttet til historikken. Du kan legge til en valgfri begrunnelse.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Begrunnelse (valgfritt)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Skriv en begrunnelse for avvisningen..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowRejectDialog(false)}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button 
              onClick={handleReject}
              disabled={isLoading}
            >
              {isLoading ? "Avviser..." : "Avvis tilbud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett tilbud til historikk?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil slette tilbudet "{conceptTitle}" og flytte det til historikken. 
              Du kan ikke angre denne handlingen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? 'Sletter...' : 'Slett til historikk'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};