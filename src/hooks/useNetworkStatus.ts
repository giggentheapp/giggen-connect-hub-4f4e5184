import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<Array<() => Promise<any>>>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Tilkoblet til internett');
      processPendingOperations();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Ingen internetttilkobling');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processPendingOperations = async () => {
    if (pendingOperations.length > 0) {
      toast.info(`Behandler ${pendingOperations.length} ventende operasjoner...`);
      
      for (const operation of pendingOperations) {
        try {
          await operation();
        } catch (error) {
          console.error('Failed to process pending operation:', error);
        }
      }
      
      setPendingOperations([]);
    }
  };

  const addPendingOperation = (operation: () => Promise<any>) => {
    if (!isOnline) {
      setPendingOperations(prev => [...prev, operation]);
      toast.warning('Operasjonen vil bli utført når internett-tilkoblingen er tilbake');
    } else {
      return operation();
    }
  };

  return { isOnline, addPendingOperation, pendingOperationsCount: pendingOperations.length };
};

// Network error handler utility
export const handleNetworkError = (error: any) => {
  console.log('Network error detected:', error?.code);
  
  if (error?.code === 'ERR_INTERNET_DISCONNECTED') {
    toast.warning('Ingen internett-tilkobling. Prøver å koble til...');
    return;
  }
  
  if (error?.code === 'ERR_NETWORK_CHANGED') {
    toast.info('Nettverket ble endret. Laster siden på nytt...');
    setTimeout(() => window.location.reload(), 2000);
    return;
  }
  
  if (error?.message?.includes('fetch')) {
    toast.error('Nettverksfeil. Sjekk internett-tilkoblingen.');
    return;
  }
};

// Safe Supabase operation wrapper
export const safeSupabaseCall = async <T>(operation: () => Promise<T>): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    handleNetworkError(error);
    throw error;
  }
};