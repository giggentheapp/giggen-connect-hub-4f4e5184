import { BandForm } from './BandForm';

interface BandCreateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const BandCreateForm = ({ onSuccess, onCancel }: BandCreateFormProps) => {
  return (
    <BandForm 
      mode="create" 
      onSuccess={onSuccess} 
      onCancel={onCancel} 
    />
  );
};
