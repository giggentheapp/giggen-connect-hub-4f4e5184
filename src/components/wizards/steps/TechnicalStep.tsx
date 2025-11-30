import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileText, Plus, Download } from 'lucide-react';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';
import { WizardStepProps } from '../BaseConceptWizard';
import { useToast } from '@/hooks/use-toast';

/**
 * TechnicalStep - Tech spec and hospitality rider selection
 * Allows selecting existing files from profile
 */
export const TechnicalStep = ({
  data,
  updateData,
  userId,
  availableTechSpecs = [],
  availableHospitalityRiders = [],
}: WizardStepProps) => {
  const [showTechSpecModal, setShowTechSpecModal] = useState(false);
  const [showHospitalityModal, setShowHospitalityModal] = useState(false);
  const { toast } = useToast();

  const handleTechSpecFileSelected = (file: any) => {
    updateData('selected_tech_spec_file', file.id);
    updateData('_techSpecFileData', file); // Store full file data for display
    toast({
      title: 'Tech spec valgt',
      description: `${file.filename} vil bli lagt til når tilbudet publiseres`,
    });
    setShowTechSpecModal(false);
  };

  const handleHospitalityFileSelected = (file: any) => {
    updateData('selected_hospitality_rider_file', file.id);
    updateData('_hospitalityFileData', file); // Store full file data for display
    toast({
      title: 'Hospitality rider valgt',
      description: `${file.filename} vil bli lagt til når tilbudet publiseres`,
    });
    setShowHospitalityModal(false);
  };

  const techSpecFile = data._techSpecFileData || availableTechSpecs?.find(
    (f: any) => f.id === data.selected_tech_spec_file
  );

  const hospitalityFile = data._hospitalityFileData || availableHospitalityRiders?.find(
    (f: any) => f.id === data.selected_hospitality_rider_file
  );

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
                        {techSpecFile.file_size
                          ? `${(techSpecFile.file_size / (1024 * 1024)).toFixed(1)}MB`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {techSpecFile.file_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={techSpecFile.file_url}
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
                      onClick={() => {
                        updateData('selected_tech_spec_file', '');
                        updateData('_techSpecFileData', null);
                      }}
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
                        {hospitalityFile.file_size
                          ? `${(hospitalityFile.file_size / (1024 * 1024)).toFixed(1)}MB`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hospitalityFile.file_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={hospitalityFile.file_url}
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
                      onClick={() => {
                        updateData('selected_hospitality_rider_file', '');
                        updateData('_hospitalityFileData', null);
                      }}
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
        category="all"
      />

      <FilebankSelectionModal
        isOpen={showHospitalityModal}
        onClose={() => setShowHospitalityModal(false)}
        onSelect={(file) => file && handleHospitalityFileSelected(file)}
        userId={userId}
        category="all"
      />
    </>
  );
};
