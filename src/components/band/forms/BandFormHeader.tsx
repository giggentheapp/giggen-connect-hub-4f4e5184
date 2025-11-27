import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BandFormHeaderProps {
  title: string;
  onBack: () => void;
}

export const BandFormHeader = ({ title, onBack }: BandFormHeaderProps) => {
  return (
    <div className="flex items-center gap-2 md:gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur -mx-3 md:-mx-6 px-3 md:px-6 py-2 md:py-3 border-b md:border-0">
      <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h1 className="text-lg md:text-2xl font-bold truncate">{title}</h1>
    </div>
  );
};
