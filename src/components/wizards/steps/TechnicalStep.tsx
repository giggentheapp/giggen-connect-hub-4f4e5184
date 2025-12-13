import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileText, Plus, Download } from 'lucide-react';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';
import { WizardStepProps } from '../BaseConceptWizard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
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

/**
 * TechnicalStep - Tech spec and hospitality rider selection
 * Allows selecting existing files from filebank with category filter
 */
export const TechnicalStep = React.memo(({
  data,
  updateData,
  userId,
  onSaveDraft,
}: WizardStepProps) => {
  const [showTechSpecModal, setShowTechSpecModal] = useState(false);
  const [showHospitalityModal, setShowHospitalityModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<'tech_spec' | 'hospitality_rider' | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTechSpecFileSelected = useCallback((file: any) => {
    updateData('selected_tech_spec_file', file.id);
    updateData('_techSpecFileData', file);
    toast({
      title: 'Tech spec valgt',
      description: `${file.filename} vil bli lagt til når tilbudet publiseres`,
    });
    setShowTechSpecModal(false);
  }, [updateData, toast]);

  const handleHospitalityFileSelected = useCallback((file: any) => {
    updateData('selected_hospitality_rider_file', file.id);
    updateData('_hospitalityFileData', file);
    toast({
      title: 'Hospitality rider valgt',
      description: `${file.filename} vil bli lagt til når tilbudet publiseres`,
    });
    setShowHospitalityModal(false);
  }, [updateData, toast]);

  const handleRemoveTechSpec = useCallback(() => {
    updateData('selected_tech_spec_file', '');
    updateData('_techSpecFileData', null);
  }, [updateData]);

  const handleRemoveHospitality = useCallback(() => {
    updateData('selected_hospitality_rider_file', '');
    updateData('_hospitalityFileData', null);
  }, [updateData]);

  // Navigate to filebank with optional draft save
  const handleNavigateToFilbank = useCallback(async (saveFirst: boolean) => {
    if (saveFirst && onSaveDraft) {
      try {
        await onSaveDraft();
        toast({
          title: '✓ Utkast lagret',
          description: 'Dine endringer er trygt lagret',
        });
      } catch (error: any) {
        toast({
          title: 'Kunne ikke lagre',
          description: error.message || 'En feil oppstod',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Close any open modal
    setShowTechSpecModal(false);
    setShowHospitalityModal(false);
    
    if (userId) {
      navigate(`/profile/${userId}?section=filbank`);
    }
  }, [onSaveDraft, userId, navigate, toast]);

  // Handle "Gå til Filbank" button click - show dialog if there's data
  const handleGoToFilbankClick = useCallback((category: 'tech_spec' | 'hospitality_rider') => {
    const hasData = Object.keys(data).some(key => {
      const value = data[key];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
      return value !== '' && value !== null && value !== undefined;
    });

    if (hasData) {
      setPendingCategory(category);
      setShowSaveDialog(true);
    } else {
      if (userId) {
        navigate(`/profile/${userId}?section=filbank`);
      }
    }
  }, [data, userId, navigate]);

  const techSpecFile = data._techSpecFileData;
  const hospitalityFile = data._hospitalityFileData;

  const formatFileSize = (size: number | null | undefined) => {
    if (!size) return '';
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Tech Spec */}
        <div className="space-y-3">
          <Label>Teknisk spesifikasjon (valgfritt)</Label>
          <p className="text-sm text-muted-foreground">
            Last opp en fil med tekniske krav for scenen
          </p>

          {techSpecFile ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{techSpecFile.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(techSpecFile.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(techSpecFile.file_url || techSpecFile.publicUrl) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={techSpecFile.file_url || techSpecFile.publicUrl}
                          download={techSpecFile.filename}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveTechSpec}
                    >
                      Fjern
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowTechSpecModal(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Velg tech spec fra Filbank
            </Button>
          )}
        </div>

        {/* Hospitality Rider */}
        <div className="space-y-3">
          <Label>Hospitality rider (valgfritt)</Label>
          <p className="text-sm text-muted-foreground">
            Last opp en fil med rider-krav (catering, oppholdsrom, etc.)
          </p>

          {hospitalityFile ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{hospitalityFile.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(hospitalityFile.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(hospitalityFile.file_url || hospitalityFile.publicUrl) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={hospitalityFile.file_url || hospitalityFile.publicUrl}
                          download={hospitalityFile.filename}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveHospitality}
                    >
                      Fjern
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowHospitalityModal(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Velg hospitality rider fra Filbank
            </Button>
          )}
        </div>
      </div>

      <FilebankSelectionModal
        isOpen={showTechSpecModal}
        onClose={() => setShowTechSpecModal(false)}
        onSelect={(file) => file && handleTechSpecFileSelected(file)}
        userId={userId}
        category="tech_spec"
        onNavigateToFilbank={() => {
          setShowTechSpecModal(false);
          setPendingCategory('tech_spec');
          setShowSaveDialog(true);
          return Promise.resolve();
        }}
      />

      <FilebankSelectionModal
        isOpen={showHospitalityModal}
        onClose={() => setShowHospitalityModal(false)}
        onSelect={(file) => file && handleHospitalityFileSelected(file)}
        userId={userId}
        category="hospitality_rider"
        onNavigateToFilbank={() => {
          setShowHospitalityModal(false);
          setPendingCategory('hospitality_rider');
          setShowSaveDialog(true);
          return Promise.resolve();
        }}
      />

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lagre utkast først?</AlertDialogTitle>
            <AlertDialogDescription>
              Du har ulagrede endringer. Vil du lagre utkastet før du går til filbanken? Dette sikrer at du ikke mister arbeidet ditt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={async () => {
                setShowSaveDialog(false);
                setPendingCategory(null);
                await handleNavigateToFilbank(false);
              }}
            >
              Fortsett uten å lagre
            </Button>
            <AlertDialogAction
              onClick={async () => {
                setShowSaveDialog(false);
                setPendingCategory(null);
                await handleNavigateToFilbank(true);
              }}
            >
              Lagre og fortsett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
