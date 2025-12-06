import { Card } from '@/components/ui/card';
import { CalendarIcon, Banknote, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { calculateExpectedRevenue, calculateArtistEarnings, formatCurrency } from '@/utils/conceptHelpers';

interface ProfileConceptCardProps {
  concept: {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
    available_dates: any;
    door_deal?: boolean;
    door_percentage?: number | null;
    price_by_agreement?: boolean;
    expected_audience?: number | null;
    ticket_price?: number | null;
    maker_id: string;
  };
}

export const ProfileConceptCard = ({ concept }: ProfileConceptCardProps) => {
  const navigate = useNavigate();

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

  const { dates: availableDates, isIndefinite } = parseAvailableDates(concept.available_dates);
  
  const formatDateDisplay = () => {
    if (isIndefinite) return 'Etter avtale';
    if (availableDates.length === 0) return '';
    
    try {
      const firstDate = new Date(availableDates[0]);
      if (isNaN(firstDate.getTime())) return '';
      
      if (availableDates.length === 1) {
        return format(firstDate, 'dd.MM.yyyy');
      }
      return `${format(firstDate, 'dd.MM.yyyy')} +${availableDates.length - 1}`;
    } catch {
      return '';
    }
  };

  const formatPriceDisplay = () => {
    if (concept.door_deal && concept.door_percentage) {
      return `${concept.door_percentage}% av dørsalg`;
    }
    if (concept.price_by_agreement) {
      return 'Etter avtale';
    }
    if (concept.price) {
      return `${concept.price} kr`;
    }
    return 'Ikke spesifisert';
  };

  const getRevenueCalculation = () => {
    const revenue = calculateExpectedRevenue(concept.expected_audience, concept.ticket_price);
    if (!revenue) return null;

    const pricingType = concept.door_deal ? 'door_deal' : concept.price_by_agreement ? 'by_agreement' : 'fixed';
    const artistEarnings = calculateArtistEarnings(revenue, pricingType, concept.price, concept.door_percentage);

    return { revenue, artistEarnings, pricingType };
  };

  const calculation = getRevenueCalculation();

  const handleClick = () => {
    navigate(`/profile/${concept.maker_id}/concept/${concept.id}`);
  };

  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">{concept.title}</h3>
        
        {concept.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {concept.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm pt-2">
          <div className="flex items-center gap-1.5">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <span>{formatPriceDisplay()}</span>
          </div>
          
          {concept.ticket_price && (
            <div className="flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <span>{concept.ticket_price} kr billett</span>
            </div>
          )}
          
          {formatDateDisplay() && (
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateDisplay()}</span>
            </div>
          )}
        </div>

        {calculation && (
          <div className="text-xs text-muted-foreground pt-1 border-t mt-2">
            Forventet dørsalg: {formatCurrency(calculation.revenue)} kr
            {calculation.artistEarnings && ` • Artist: ${formatCurrency(calculation.artistEarnings)} kr`}
          </div>
        )}
      </div>
    </Card>
  );
};
