import { BandForm } from './BandForm';
import { Band } from '@/types/band';

interface BandEditFormProps {
  band: Band;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BandEditForm = ({ band, onSuccess, onCancel }: BandEditFormProps) => {
  return (
    <BandForm 
      mode="edit" 
      band={band}
      onSuccess={onSuccess} 
      onCancel={onCancel} 
    />
  );
};
