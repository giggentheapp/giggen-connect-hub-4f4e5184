import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileText, Plus, X, Image, Video, File as FileIcon, Music } from 'lucide-react';

interface ConceptData {
  title: string;
  description: string;
  program_type?: string;
  price: string;
  expected_audience: string;
  tech_spec: string;
  available_dates: Date[];
  portfolio_files: any[];
  selected_tech_spec_file: string;
  selected_hospitality_rider_file: string;
  is_indefinite: boolean;
  pricing_type: 'fixed' | 'door_deal' | 'by_agreement';
  door_percentage: string;
}

interface ArrangørOfferWizardProps {
  currentStep: number;
  conceptData: ConceptData;
  updateConceptData: (key: string, value: any) => void;
  onOpenFilebankModal: () => void;
  onOpenTechSpecModal: () => void;
  onOpenHospitalityModal: () => void;
  onRemovePortfolioFile: (index: number) => void;
  userId: string;
  handleSaveDraft: () => void;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('image')) return <Image className="h-4 w-4 text-blue-500" />;
  if (fileType.includes('video')) return <Video className="h-4 w-4 text-purple-500" />;
  if (fileType.includes('audio')) return <Music className="h-4 w-4 text-green-500" />;
  return <FileIcon className="h-4 w-4 text-gray-500" />;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
};

export const ArrangørOfferWizard = ({
  currentStep,
  conceptData,
  updateConceptData,
  onOpenFilebankModal,
  onOpenTechSpecModal,
  onOpenHospitalityModal,
  onRemovePortfolioFile,
  userId,
  handleSaveDraft,
}: ArrangørOfferWizardProps) => {
  return (
    <>
      {/* Step 0: Grunnleggende */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              placeholder="F.eks. 'Quiz Kveld - Mandager' eller 'Jam Session - Torsdager'"
              value={conceptData.title}
              onChange={(e) => updateConceptData('title', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              placeholder="Beskriv programmet og hva musikere kan forvente..."
              value={conceptData.description}
              onChange={(e) => updateConceptData('description', e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>
      )}

      {/* Step 1: Detaljer (med programtype) */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Programtype Selector */}
          <div>
            <Label htmlFor="program-type">Programtype *</Label>
            <Select
              value={conceptData.program_type || ''}
              onValueChange={(value) => updateConceptData('program_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg programtype..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="standup">Standup</SelectItem>
                <SelectItem value="jam">Jam Session</SelectItem>
                <SelectItem value="visekveld">Visekveld</SelectItem>
                <SelectItem value="lokale_helter">Lokale Helter</SelectItem>
                <SelectItem value="open_mic">Open Mic</SelectItem>
                <SelectItem value="annet">Annet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prismodell */}
          <div className="space-y-4 p-4 border rounded-lg">
            <Label className="text-base font-semibold">Prismodell *</Label>
            <RadioGroup
              value={conceptData.pricing_type}
              onValueChange={(value: any) => {
                updateConceptData('pricing_type', value);
                if (value !== 'fixed') updateConceptData('price', '');
                if (value !== 'door_deal') updateConceptData('door_percentage', '');
              }}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed-price" />
                <Label htmlFor="fixed-price" className="cursor-pointer">Fast pris</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="door_deal" id="door-deal" />
                <Label htmlFor="door-deal" className="cursor-pointer">Døravtale (%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="by_agreement" id="by-agreement" />
                <Label htmlFor="by-agreement" className="cursor-pointer">Pris etter avtale</Label>
              </div>
            </RadioGroup>

            {conceptData.pricing_type === 'fixed' && (
              <div>
                <Label htmlFor="price">Pris (NOK) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="5000"
                  value={conceptData.price}
                  onChange={(e) => updateConceptData('price', e.target.value)}
                />
              </div>
            )}

            {conceptData.pricing_type === 'door_deal' && (
              <div>
                <Label htmlFor="door-percentage">Prosent av inntekter *</Label>
                <Input
                  id="door-percentage"
                  type="number"
                  placeholder="50"
                  value={conceptData.door_percentage}
                  onChange={(e) => updateConceptData('door_percentage', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Publikum */}
          <div>
            <Label htmlFor="audience">Forventet publikum *</Label>
            <Input
              id="audience"
              type="number"
              placeholder="100"
              value={conceptData.expected_audience}
              onChange={(e) => updateConceptData('expected_audience', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 2: Portfolio */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Portfolio filer</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenFilebankModal}
            >
              <Plus className="h-4 w-4 mr-2" />
              Legg til fra filbank
            </Button>
          </div>

          {conceptData.portfolio_files.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {conceptData.portfolio_files.map((file, index) => (
                <div
                  key={file.filebankId || file.conceptFileId || index}
                  className="relative group rounded-lg border p-3 hover:border-primary transition-colors"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemovePortfolioFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="flex items-start gap-2">
                    {getFileIcon(file.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.filename}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFileSize(file.file_size)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {conceptData.portfolio_files.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">Ingen filer lagt til ennå</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Teknisk */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <Label>Tech Spec (valgfritt)</Label>
            <Button
              variant="outline"
              onClick={onOpenTechSpecModal}
              className="w-full"
              type="button"
            >
              <FileText className="h-4 w-4 mr-2" />
              Velg fra Filbank
            </Button>
          </div>

          <div>
            <Label>Hospitality Rider (valgfritt)</Label>
            <Button
              variant="outline"
              onClick={onOpenHospitalityModal}
              className="w-full"
              type="button"
            >
              <FileText className="h-4 w-4 mr-2" />
              Velg fra Filbank
            </Button>
          </div>

          <div>
            <Label htmlFor="tech-spec">Tekniske notater</Label>
            <Textarea
              id="tech-spec"
              placeholder="Evt. tekniske krav eller merknader..."
              value={conceptData.tech_spec}
              onChange={(e) => updateConceptData('tech_spec', e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
      )}

      {/* Step 4: Datoer */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="indefinite"
              checked={conceptData.is_indefinite}
              onCheckedChange={(checked) => updateConceptData('is_indefinite', checked)}
            />
            <Label htmlFor="indefinite">Tilgjengelig på ubestemt tid</Label>
          </div>

          {!conceptData.is_indefinite && (
            <div>
              <Label>Velg tilgjengelige datoer *</Label>
              <Calendar
                mode="multiple"
                selected={conceptData.available_dates}
                onSelect={(dates) => updateConceptData('available_dates', dates || [])}
                className="rounded-md border"
                disabled={{ before: new Date() }}
              />
              {conceptData.available_dates.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {conceptData.available_dates.length} dato(er) valgt
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 5: Preview */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="p-6 border rounded-lg space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{conceptData.title}</h3>
              <p className="text-muted-foreground mt-1">{conceptData.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Programtype:</span>
                <p className="font-medium capitalize">{conceptData.program_type || 'Ikke spesifisert'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Pris:</span>
                <p className="font-medium">
                  {conceptData.pricing_type === 'fixed' && `${conceptData.price} NOK`}
                  {conceptData.pricing_type === 'door_deal' && `${conceptData.door_percentage}% døravtale`}
                  {conceptData.pricing_type === 'by_agreement' && 'Etter avtale'}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Publikum:</span>
                <p className="font-medium">{conceptData.expected_audience} personer</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Datoer:</span>
                <p className="font-medium">
                  {conceptData.is_indefinite ? 'Ubestemt tid' : `${conceptData.available_dates.length} datoer`}
                </p>
              </div>
            </div>

            {conceptData.portfolio_files.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Portfolio filer:</span>
                <p className="text-sm">{conceptData.portfolio_files.length} fil(er)</p>
              </div>
            )}

            {conceptData.tech_spec && (
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Tekniske notater:</span>
                <p className="text-sm">{conceptData.tech_spec}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
