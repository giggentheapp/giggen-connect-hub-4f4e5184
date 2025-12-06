import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FileText, Image, Video, Music, Download, MoreVertical, Ticket, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ConceptActionsDialog } from '@/components/ConceptActionsDialog';
import { ConceptPortfolioGallery } from '@/components/ConceptPortfolioGallery';
import { useConceptActions } from '@/hooks/useConceptActions';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { toast } from 'sonner';
import { calculateExpectedRevenue, calculateArtistEarnings, formatCurrency } from '@/utils/conceptHelpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConceptCardProps {
  concept: {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
    expected_audience: number | null;
    tech_spec: string | null;
    tech_spec_reference: string | null;
    hospitality_rider_reference?: string | null;
    available_dates: any;
    is_published: boolean;
    status: string;
    created_at: string;
    maker_id: string;
    // Flexible pricing fields
    door_deal?: boolean;
    door_percentage?: number | null;
    price_by_agreement?: boolean;
    ticket_price?: number | null;
  };
  showActions?: boolean;
  showConceptActions?: boolean;
  onDelete?: () => void;
  onConceptAction?: (action: 'rejected' | 'deleted') => void;
}

interface ConceptFile {
  id: string;
  filename: string;
  file_type: string;
  file_url: string;
  title?: string;
  created_at: string;
  mime_type?: string;
}

interface TechSpecFile {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
}

interface HospitalityRiderFile {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
}

const ConceptCard = ({ 
  concept, 
  showActions = false, 
  showConceptActions = false, 
  onDelete,
  onConceptAction
}: ConceptCardProps) => {
  console.log('ConceptCard rendering with concept:', concept.id);
  
  const { t } = useAppTranslation();
  const [conceptFiles, setConceptFiles] = useState<ConceptFile[]>([]);
  const [techSpecFile, setTechSpecFile] = useState<TechSpecFile | null>(null);
  const [hospitalityRiderFile, setHospitalityRiderFile] = useState<HospitalityRiderFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActionsDialog, setShowActionsDialog] = useState(false);
  const [profileSettings, setProfileSettings] = useState<any>(null);
  
  const { rejectConcept, deleteConcept, loading: actionLoading } = useConceptActions();

  useEffect(() => {
    loadConceptData();
  }, [concept.id]);

  const loadConceptData = async () => {
    try {
      // Concepts now control their own visibility via is_published
      // Portfolio files are always loaded for published concepts
      const { data: filesData, error: filesError } = await supabase
        .from('concept_files')
        .select('id, filename, file_type, file_url, file_path, title, created_at, mime_type')
        .eq('concept_id', concept.id);

      console.log('🔍 CONCEPT FILES LOADED:', {
        conceptId: concept.id,
        conceptTitle: concept.title,
        filesError,
        fileCount: filesData?.length || 0,
        files: filesData?.map(f => ({
          id: f.id,
          filename: f.filename,
          file_url: f.file_url,
          file_path: f.file_path,
          has_url: !!f.file_url
        }))
      });

      if (filesError) {
        console.error('Error loading concept files:', filesError);
      } else {
        setConceptFiles(filesData || []);
      }

      // Load tech spec file if reference exists
      if (concept.tech_spec_reference) {
        const { data: techSpecData, error: techSpecError } = await supabase
          .from('profile_tech_specs')
          .select('id, filename, file_url, file_type')
          .eq('id', concept.tech_spec_reference)
          .maybeSingle();

        if (techSpecError) {
          console.error('Error loading tech spec file:', techSpecError);
        } else {
          setTechSpecFile(techSpecData);
        }
      }

      // Load hospitality rider file if reference exists - always show if exists
      if (concept.hospitality_rider_reference) {
        const { data: hospitalityRiderData, error: hospitalityRiderError} = await supabase
          .from('hospitality_riders')
          .select('id, filename, file_url, file_type')
          .eq('id', concept.hospitality_rider_reference)
          .maybeSingle();

        if (hospitalityRiderError) {
          console.error('Error loading hospitality rider file:', hospitalityRiderError);
        } else {
          setHospitalityRiderFile(hospitalityRiderData);
        }
      }
    } catch (error) {
      console.error('Error loading concept data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <Image className="h-4 w-4" />;
    if (fileType.includes('video')) return <Video className="h-4 w-4" />;
    if (fileType.includes('audio')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const parseAvailableDates = (datesData: any) => {
    if (!datesData) return { dates: [], isIndefinite: false };
    try {
      const dates = typeof datesData === 'string' ? JSON.parse(datesData) : datesData;
      if (dates && typeof dates === 'object' && dates.indefinite) {
        return { dates: [], isIndefinite: true };
      }
      return { dates: Array.isArray(dates) ? dates : [], isIndefinite: false };
    } catch {
      return { dates: [], isIndefinite: false };
    }
  };

  const handleReject = async (reason?: string) => {
    const result = await rejectConcept(concept.id, reason);
    if (result.success && onConceptAction) {
      onConceptAction('rejected');
    }
  };

  const handleDelete = async () => {
    const result = await deleteConcept(concept.id);
    if (result.success && onConceptAction) {
      onConceptAction('deleted');
    }
  };

  const { dates: availableDates, isIndefinite } = parseAvailableDates(concept.available_dates);

  // Revenue calculation
  const revenueCalculation = useMemo(() => {
    if (!concept.expected_audience || !concept.ticket_price) return null;
    
    const revenue = calculateExpectedRevenue(concept.expected_audience, concept.ticket_price);
    if (!revenue) return null;

    const pricingType = concept.door_deal ? 'door_deal' : concept.price_by_agreement ? 'by_agreement' : 'fixed';
    const artistEarnings = calculateArtistEarnings(
      revenue, 
      pricingType, 
      concept.price, 
      concept.door_percentage
    );

    return { revenue, artistEarnings, pricingType };
  }, [concept.expected_audience, concept.ticket_price, concept.door_deal, concept.price_by_agreement, concept.price, concept.door_percentage]);

  return (
    <Card className="w-full">
      <CardHeader className="px-3 md:px-6 py-3 md:py-6 pb-2 md:pb-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
              <CardTitle className="text-base md:text-xl">{concept.title}</CardTitle>
              <Badge 
                variant={concept.is_published ? "default" : "secondary"} 
                className="text-xs"
              >
                {concept.is_published ? t('conceptCard.published') : t('conceptCard.draft')}
              </Badge>
            </div>
            {concept.description && (
              <p className="text-muted-foreground text-sm md:text-base">{concept.description}</p>
            )}
          </div>

          {(showActions || showConceptActions) && (
            <div className="flex gap-2">
              {/* Concept Actions (Reject/Delete) */}
              {showConceptActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={actionLoading} className="h-7 px-2 md:h-9 md:px-3">
                      <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowActionsDialog(true)}>
                      {t('conceptCard.offerActions')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Traditional Delete Action */}
              {showActions && onDelete && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm"
                  onClick={() => {
                    if (window.confirm(t('conceptCard.deleteConfirm'))) {
                      onDelete();
                    }
                  }}
                >
                  {t('conceptCard.delete')}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 md:space-y-6 px-3 md:px-6 pb-3 md:pb-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-sm md:text-base">
          <div className="flex items-center gap-2">
            <span className="font-medium">{t('conceptCard.price')}</span>
            <span>
              {concept.door_deal && concept.door_percentage
                ? `${concept.door_percentage}% ${t('conceptCard.ofDoorRevenue')}`
                : concept.price_by_agreement
                ? t('conceptCard.byAgreement')
                : concept.price
                ? `${concept.price} Kr`
                : t('conceptCard.notSpecified')
              }
            </span>
          </div>
          {concept.expected_audience && (
            <div className="flex items-center gap-2">
              <span className="font-medium">{t('conceptCard.audience')}</span>
              <span>{concept.expected_audience} {t('conceptCard.people')}</span>
            </div>
          )}
          {concept.ticket_price && (
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Billettpris:</span>
              <span>{concept.ticket_price} kr</span>
            </div>
          )}
        </div>

        {/* Revenue Calculation */}
        {revenueCalculation && (
          <div className="bg-muted/30 p-3 rounded-lg border text-sm">
            <div className="flex items-center gap-2 font-medium mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Beregnet inntekt
            </div>
            <div className="space-y-1">
              <p>
                Forventet dørsalg: {formatCurrency(concept.expected_audience || 0)} × {formatCurrency(concept.ticket_price || 0)} kr = <strong>{formatCurrency(revenueCalculation.revenue)} kr</strong>
              </p>
              {revenueCalculation.pricingType === 'fixed' && concept.price && (
                <p className="text-muted-foreground">
                  Betaling til artist: <strong>{formatCurrency(concept.price)} kr</strong> (fast)
                </p>
              )}
              {revenueCalculation.pricingType === 'door_deal' && concept.door_percentage && revenueCalculation.artistEarnings && (
                <p className="text-muted-foreground">
                  Betaling til artist: {concept.door_percentage}% = <strong>{formatCurrency(revenueCalculation.artistEarnings)} kr</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Available Dates */}
        {(availableDates.length > 0 || isIndefinite) && (
          <div>
            <h4 className="font-medium mb-1 md:mb-2 flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
              <CalendarIcon className="h-3 w-3 md:h-4 md:w-4" />
              {t('conceptCard.availableDates')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {isIndefinite ? (
                <Badge variant="outline">
                  {t('conceptCard.indefiniteByAgreement')}
                </Badge>
               ) : (
                Array.isArray(availableDates) ? availableDates.filter(date => date).map((date: string, index: number) => {
                  try {
                    const dateObj = new Date(date);
                    if (isNaN(dateObj.getTime())) {
                      return null;
                    }
                    return (
                      <Badge key={date || `date-${index}`} variant="outline">
                        {format(dateObj, 'dd.MM.yyyy')}
                      </Badge>
                    );
                  } catch {
                    return null;
                  }
                }).filter(Boolean) : <></>
               )}
            </div>
          </div>
        )}

        {/* Concept Portfolio Files - Instagram-style Gallery */}
        {conceptFiles.length > 0 && (
          <div>
            <ConceptPortfolioGallery conceptId={concept.id} />
          </div>
        )}

        {/* Tech Spec File */}
        {techSpecFile && (
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('conceptCard.technicalSpec')}
            </h4>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <h5 className="font-medium text-sm">{techSpecFile.filename}</h5>
                    <p className="text-xs text-muted-foreground">{t('conceptCard.technicalSpec')}</p>
                  </div>
                </div>
                <Button
                  variant="outline" 
                  size="sm"
                  className="h-6 px-2 text-xs md:h-9 md:px-3 md:text-sm"
                  onClick={() => window.open(techSpecFile.file_url, '_blank')}
                >
                  <Download className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                  {t('conceptCard.download')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hospitality Rider File */}
        {hospitalityRiderFile && (
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('conceptCard.hospitalityRider')}
            </h4>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <h5 className="font-medium text-sm">{hospitalityRiderFile.filename}</h5>
                    <p className="text-xs text-muted-foreground">{t('conceptCard.hospitalityRider')}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm" 
                  className="h-6 px-2 text-xs md:h-9 md:px-3 md:text-sm"
                  onClick={() => window.open(hospitalityRiderFile.file_url, '_blank')}
                >
                  <Download className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                  {t('conceptCard.download')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-4">
            <div className="animate-pulse">{t('conceptCard.loadingDetails')}</div>
          </div>
        )}

        {/* Empty states */}
        {!loading && conceptFiles.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            {t('conceptCard.noPortfolioFiles')}
          </div>
        )}

        {/* Created date */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          {t('conceptCard.created')} {format(new Date(concept.created_at), 'dd.MM.yyyy HH:mm')}
        </div>
      </CardContent>
      
      {/* Concept Actions Dialog */}
      {showConceptActions && (
        <ConceptActionsDialog
          isOpen={showActionsDialog}
          onClose={() => setShowActionsDialog(false)}
          onReject={handleReject}
          onDelete={handleDelete}
          conceptTitle={concept.title}
          isLoading={actionLoading}
        />
      )}
    </Card>
  );
};

export default ConceptCard;