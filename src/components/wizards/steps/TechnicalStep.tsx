import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileText, Download, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { WizardStepProps } from '../BaseConceptWizard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * TechnicalStep - Tech spec and hospitality rider selection
 * Allows selecting existing files from profile_tech_specs and hospitality_riders tables
 */
export const TechnicalStep = React.memo(({
  data,
  updateData,
  userId,
  availableTechSpecs = [],
  availableHospitalityRiders = [],
}: WizardStepProps) => {
  // Find selected files from available lists
  const techSpecFile = availableTechSpecs?.find(
    (f: any) => f.id === data.selected_tech_spec_file
  ) || data._techSpecFileData;

  const hospitalityFile = availableHospitalityRiders?.find(
    (f: any) => f.id === data.selected_hospitality_rider_file
  ) || data._hospitalityFileData;

  const handleTechSpecSelect = useCallback((file: any) => {
    updateData('selected_tech_spec_file', file.id);
    updateData('_techSpecFileData', file);
  }, [updateData]);

  const handleHospitalitySelect = useCallback((file: any) => {
    updateData('selected_hospitality_rider_file', file.id);
    updateData('_hospitalityFileData', file);
  }, [updateData]);

  const handleRemoveTechSpec = useCallback(() => {
    updateData('selected_tech_spec_file', '');
    updateData('_techSpecFileData', null);
  }, [updateData]);

  const handleRemoveHospitality = useCallback(() => {
    updateData('selected_hospitality_rider_file', '');
    updateData('_hospitalityFileData', null);
  }, [updateData]);

  const formatFileSize = (size: number | null) => {
    if (!size) return '';
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-6">
      {/* Tech Spec */}
      <div className="space-y-3">
        <Label>Teknisk spesifikasjon (valgfritt)</Label>
        <p className="text-sm text-muted-foreground">
          Velg en tech spec fra din profil
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
                    onClick={handleRemoveTechSpec}
                  >
                    Fjern
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : availableTechSpecs.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Velg tech spec
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[300px]">
              {availableTechSpecs.map((file: any) => (
                <DropdownMenuItem
                  key={file.id}
                  onClick={() => handleTechSpecSelect(file)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span className="flex-1">{file.filename}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Du har ingen tech specs. Last opp en tech spec i din profil først.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Hospitality Rider */}
      <div className="space-y-3">
        <Label>Hospitality rider (valgfritt)</Label>
        <p className="text-sm text-muted-foreground">
          Velg en hospitality rider fra din profil
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
                    onClick={handleRemoveHospitality}
                  >
                    Fjern
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : availableHospitalityRiders.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Velg hospitality rider
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[300px]">
              {availableHospitalityRiders.map((file: any) => (
                <DropdownMenuItem
                  key={file.id}
                  onClick={() => handleHospitalitySelect(file)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span className="flex-1">{file.filename}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Du har ingen hospitality riders. Last opp en hospitality rider i din profil først.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
});
