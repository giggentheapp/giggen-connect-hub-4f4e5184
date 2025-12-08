import { useState, useEffect } from 'react';
import { Band } from '@/types/band';

interface ContactInfo {
  email: string;
  phone: string;
  bookingEmail: string;
}

export const useBandContact = (initialBand?: Band) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: '',
    bookingEmail: '',
  });

  useEffect(() => {
    if (initialBand) {
      setContactInfo({
        email: initialBand.contact_info?.email || '',
        phone: initialBand.contact_info?.phone || '',
        bookingEmail: initialBand.contact_info?.booking_email || '',
      });
    }
  }, [initialBand]);

  const setField = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const reset = () => {
    setContactInfo({
      email: '',
      phone: '',
      bookingEmail: '',
    });
  };

  return {
    contactInfo,
    setField,
    reset,
  };
};
