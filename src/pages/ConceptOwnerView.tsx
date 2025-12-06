import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarIcon, Users, DollarSign, FileText, Edit, Eye, EyeOff, Expand, Play, Music as MusicIcon, Ticket, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { conceptService } from '@/services/conceptService';
import { useUpdateConcept } from '@/hooks/useConceptMutations';
import { handleError } from '@/lib/errorHandler';
import { calculateExpectedRevenue, calculateArtistEarnings, formatCurrency } from '@/utils/conceptHelpers';

interface ConceptFile {
  id: string;
  filename: string;
  file_type: string;
  file_url: string;
  file_path: string;
  title?: string;
  created_at: string;
  mime_type?: string;
  thumbnail_path?: string;
}

export default function ConceptOwnerView() {
  const { conceptId } = useParams<{ conceptId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conceptFiles, setConceptFiles] = useState<ConceptFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ConceptFile | null>(null);
  const [concept, setConcept] = useState<any>(null);
  const [conceptLoading, setConceptLoading] = useState(true);

  const { user, loading: userLoading } = useCurrentUser();
  const updateConceptMutation = useUpdateConcept();

  const currentUserId = user?.id || null;
  const isOwner = currentUserId === concept?.maker_id;
  const loading = userLoading || conceptLoading;

  // Fetch concept directly by ID (allows viewing concepts from any user)
  useEffect(() => {
    const loadConcept = async () => {
      if (!conceptId) {
        setConceptLoading(false);
        return;
      }
      
      try {
        setConceptLoading(true);
        const fetchedConcept = await conceptService.getById(conceptId, true);
        setConcept(fetchedConcept);
      } catch (error) {
        handleError(error, 'Kunne ikke laste tilbudet');
      } finally {
        setConceptLoading(false);
      }
    };
    
    loadConcept();
  }, [conceptId]);

  useEffect(() => {
    if (concept?.id) {
      loadConceptFiles(concept.id);
    }
  }, [concept?.id]);

  const loadConceptFiles = async (id: string) => {
    try {
      const files = await conceptService.getConceptFiles(id);
      setConceptFiles(files as ConceptFile[]);
    } catch (error: any) {
      console.error('Failed to load concept files:', error);
      toast({
        title: 'Kunne ikke laste filer',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const togglePublished = async () => {
    if (!concept) return;

    try {
      await updateConceptMutation.mutateAsync({
        conceptId: concept.id,
        updates: { is_published: !concept.is_published },
      });
    } catch (error: any) {
      toast({
        title: 'Kunne ikke endre synlighet',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const parseAvailableDates = (datesData: any) => {
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

  const getPublicUrl = (filePath: string) => {
    return `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/${filePath}`;
  };

  const isVideoFile = (file: ConceptFile) => {
    return file.file_type === 'video' || file.mime_type?.startsWith('video/');
  };

  const isAudioFile = (file: ConceptFile) => {
    return file.file_type === 'audio' || file.mime_type?.startsWith('audio/');
  };

  const renderFilePreview = (file: ConceptFile) => {
    const publicUrl = getPublicUrl(file.file_path);

    // Image
    if (file.file_type === 'image' || file.mime_type?.startsWith('image/')) {
      return (
        <div className="relative w-full h-full group">
          <img
            src={publicUrl}
            alt={file.title || file.filename}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Video with thumbnail
    if (isVideoFile(file) && file.thumbnail_path) {
      const thumbnailUrl = getPublicUrl(file.thumbnail_path);
      return (
        <div className="relative w-full h-full group">
          <img
            src={thumbnailUrl}
            alt={file.title || file.filename}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Video without thumbnail
    if (isVideoFile(file)) {
      return (
        <div className="relative w-full h-full group">
          <video
            src={publicUrl}
            className="w-full h-full object-cover"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Audio with thumbnail
    if (isAudioFile(file) && file.thumbnail_path) {
      const thumbnailUrl = getPublicUrl(file.thumbnail_path);
      return (
        <div className="relative w-full h-full group">
          <img
            src={thumbnailUrl}
            alt={file.title || file.filename}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <MusicIcon className="w-6 h-6 text-accent-orange" />
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Audio without thumbnail
    if (isAudioFile(file)) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 group flex flex-col items-center justify-center p-4">
          <MusicIcon className="w-12 h-12 text-accent-orange mb-2" />
          <p className="text-xs font-medium text-center truncate w-full px-2">
            {file.title || file.filename}
          </p>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
        </div>
      );
    }

    // Fallback
    return (
      <div className="relative w-full h-full bg-muted flex items-center justify-center">
        <FileText className="w-12 h-12 text-muted-foreground" />
      </div>
    );
  };

  const renderModalContent = (file: ConceptFile) => {
    const publicUrl = getPublicUrl(file.file_path);

    if (file.file_type === 'image' || file.mime_type?.startsWith('image/')) {
      return (
        <img
          src={publicUrl}
          alt={file.title || file.filename}
          className="w-full h-auto max-h-[80vh] object-contain"
        />
      );
    }

    if (isVideoFile(file)) {
      return (
        <video
          src={publicUrl}
          controls
          autoPlay
          className="w-full h-auto max-h-[80vh]"
        >
          <source src={publicUrl} type={file.mime_type || 'video/mp4'} />
        </video>
      );
    }

    if (isAudioFile(file)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 gap-6 bg-gradient-to-br from-background to-muted min-h-[300px]">
          <MusicIcon className="w-16 h-16 text-accent-orange" />
          <p className="text-lg font-medium text-center">{file.title || file.filename}</p>
          <audio
            controls
            autoPlay
            className="w-full max-w-md"
            preload="metadata"
          >
            <source src={publicUrl} type={file.mime_type || 'audio/mpeg'} />
          </audio>
        </div>
      );
    }

    return null;
  };

  // Revenue calculation - MUST be before any early returns to follow hooks rules
  const revenueCalculation = useMemo(() => {
    if (!concept || !concept.expected_audience || !concept.ticket_price) return null;
    
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
  }, [concept]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Fant ikke tilbudet</p>
          <Button onClick={() => navigate('/dashboard?section=admin-concepts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til Mine tilbud
          </Button>
        </div>
      </div>
    );
  }

  const { dates: availableDates, isIndefinite } = parseAvailableDates(concept.available_dates);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/5 via-accent-orange/5 to-background border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(isOwner ? '/dashboard?section=admin-concepts' : '/dashboard?section=bookings')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isOwner ? 'Tilbake til Mine tilbud' : 'Tilbake'}
          </Button>

          {/* Header */}
          <div className="max-w-4xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold">{concept.title}</h1>
                  <Badge variant={concept.is_published ? 'default' : 'secondary'}>
                    {concept.is_published ? 'Publisert' : 'Utkast'}
                  </Badge>
                </div>
                {concept.description && (
                  <p className="text-lg text-muted-foreground">{concept.description}</p>
                )}
              </div>

              {/* Action Buttons - Only for owner */}
              {isOwner && (
                <div className="flex gap-2 shrink-0">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border">
                    {concept.is_published ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={concept.is_published}
                      onCheckedChange={togglePublished}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                  <Button onClick={() => navigate(`/create-offer?edit=${concept.id}`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rediger
                  </Button>
                </div>
              )}
            </div>

            {/* Key Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price */}
              <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Pris</span>
                </div>
                <p className="text-lg font-semibold">
                  {concept.door_deal && concept.door_percentage
                    ? `${concept.door_percentage}% av dørinntekter`
                    : concept.price_by_agreement
                    ? 'Ved avtale'
                    : concept.price
                    ? `${concept.price} Kr`
                    : 'Ikke spesifisert'}
                </p>
              </div>

              {/* Audience */}
              {concept.expected_audience && (
                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Forventet publikum</span>
                  </div>
                  <p className="text-lg font-semibold">{concept.expected_audience} personer</p>
                </div>
              )}

              {/* Ticket Price */}
              {concept.ticket_price && (
                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Ticket className="h-4 w-4" />
                    <span className="text-sm">Billettpris</span>
                  </div>
                  <p className="text-lg font-semibold">{concept.ticket_price} kr</p>
                </div>
              )}

              {/* Dates */}
              {(availableDates.length > 0 || isIndefinite) && (
                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm">Tilgjengelighet</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {isIndefinite
                      ? 'Ubestemt / Ved avtale'
                      : `${availableDates.length} dato${availableDates.length !== 1 ? 'er' : ''}`}
                  </p>
                </div>
              )}
            </div>

            {/* Revenue Calculation */}
            {revenueCalculation && (
              <div className="bg-muted/30 p-4 rounded-lg border mt-4">
                <div className="flex items-center gap-2 font-medium mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Beregnet inntekt
                </div>
                <div className="space-y-1 text-sm">
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
          </div>
        </div>
      </div>

      {/* Available Dates Section */}
      {!isIndefinite && availableDates.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Tilgjengelige datoer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableDates.map((date: any, index: number) => (
              <div key={index} className="bg-card p-3 rounded-lg border text-center">
                <p className="text-sm font-medium">{format(new Date(date), 'd. MMM yyyy')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Section */}
      {conceptFiles.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {conceptFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer border hover:border-primary transition-colors"
              >
                {renderFilePreview(file)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl">
          {selectedFile && renderModalContent(selectedFile)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
