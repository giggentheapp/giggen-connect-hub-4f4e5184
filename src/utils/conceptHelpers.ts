/**
 * Calculate expected revenue from ticket sales
 */
export const calculateExpectedRevenue = (
  audience: number | null | undefined,
  ticketPrice: number | null | undefined
): number | null => {
  if (!audience || !ticketPrice) return null;
  return audience * ticketPrice;
};

/**
 * Calculate artist earnings based on pricing model
 */
export const calculateArtistEarnings = (
  revenue: number | null,
  pricingType: 'fixed' | 'door_deal' | 'by_agreement',
  fixedPrice: number | null | undefined,
  doorPercentage: number | null | undefined
): number | null => {
  if (pricingType === 'fixed' && fixedPrice) {
    return fixedPrice;
  }
  
  if (pricingType === 'door_deal' && doorPercentage && revenue) {
    return Math.round(revenue * (doorPercentage / 100));
  }
  
  return null;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('nb-NO', { 
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }).format(amount);
};
