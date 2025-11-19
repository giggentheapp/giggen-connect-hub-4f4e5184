import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalQuickActionButtonProps {
  onClick: () => void;
}

export const GlobalQuickActionButton = ({ onClick }: GlobalQuickActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "hidden md:flex h-12 w-12 rounded-full bg-orange-500 text-white",
        "hover:bg-orange-600 hover:scale-105 transition-all duration-150",
        "shadow-lg shadow-orange-500/30 flex items-center justify-center",
        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      )}
      title="Opprett nytt"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
};
