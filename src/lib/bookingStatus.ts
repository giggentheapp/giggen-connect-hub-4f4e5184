export type BookingStatus = 
  | 'pending' 
  | 'allowed' 
  | 'approved_by_sender' 
  | 'approved_by_receiver' 
  | 'approved_by_both' 
  | 'upcoming' 
  | 'completed' 
  | 'cancelled';

export const getStatusInfo = (status: BookingStatus, isSender: boolean) => {
  switch (status) {
    case 'pending':
      return {
        label: isSender ? 'Venter på svar' : 'Ny forespørsel',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
        phase: 1,
        description: isSender ? 'Forespørselen venter på mottakers svar' : 'Du har mottatt en ny booking-forespørsel'
      };
    case 'allowed':
      return {
        label: 'Forhandling pågår',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
        phase: 2,
        description: 'Begge parter kan nå redigere detaljer og må godkjenne for publisering'
      };
    case 'approved_by_sender':
      return {
        label: isSender ? 'Du har godkjent - venter på motpart' : 'Motpart har godkjent - din tur!',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
        phase: 2,
        description: 'En part har godkjent, venter på den andre'
      };
    case 'approved_by_receiver':
      return {
        label: isSender ? 'Motpart har godkjent - din tur!' : 'Du har godkjent - venter på motpart',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
        phase: 2,
        description: 'En part har godkjent, venter på den andre'
      };
    case 'approved_by_both':
      return {
        label: 'Begge har godkjent - klar for publisering',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
        phase: 3,
        description: 'Begge parter kan nå publisere arrangementet'
      };
    case 'upcoming':
      return {
        label: 'Publisert arrangement',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
        phase: 3,
        description: 'Arrangementet er publisert og synlig for andre'
      };
    case 'completed':
      return {
        label: 'Fullført',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
        phase: 4,
        description: 'Arrangementet er gjennomført'
      };
    case 'cancelled':
      return {
        label: 'Avlyst',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        phase: 0,
        description: 'Arrangementet ble avlyst'
      };
    default:
      return {
        label: 'Ukjent status',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
        phase: 0,
        description: 'Ukjent status'
      };
  }
};

export const isActiveBooking = (status: BookingStatus): boolean => {
  return ['pending', 'allowed', 'approved_by_sender', 'approved_by_receiver', 'approved_by_both', 'upcoming'].includes(status);
};

export const isHistoricalBooking = (status: BookingStatus): boolean => {
  return ['completed', 'cancelled'].includes(status);
};

export const canBeEditedByParties = (status: BookingStatus): boolean => {
  return ['allowed', 'approved_by_sender', 'approved_by_receiver'].includes(status);
};

export const canBeCancelledPermanently = (status: BookingStatus): boolean => {
  return ['allowed', 'approved_by_sender', 'approved_by_receiver'].includes(status);
};

export const requiresApproval = (status: BookingStatus): boolean => {
  return ['allowed', 'approved_by_sender', 'approved_by_receiver'].includes(status);
};

export const canBePublished = (status: BookingStatus): boolean => {
  return status === 'approved_by_both';
};