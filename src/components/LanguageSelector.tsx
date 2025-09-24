import { useAppLanguage } from '../contexts/AppLanguageContext';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export const LanguageSelector = ({ variant = 'default', className }: LanguageSelectorProps) => {
  const { language, changeLanguage } = useAppLanguage();
  
  if (variant === 'compact') {
    return (
      <div className={cn("relative", className)}>
        <select 
          value={language}
          onChange={(e) => changeLanguage(e.target.value as 'no' | 'en')}
          className="bg-secondary border border-border rounded-md px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="no">Norsk</option>
          <option value="en">English</option>
        </select>
      </div>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={language === 'no' ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('no')}
        className={cn(
          "transition-all",
          language === 'no' && "shadow-glow"
        )}
      >
        Norsk
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('en')}
        className={cn(
          "transition-all",
          language === 'en' && "shadow-glow"
        )}
      >
        English
      </Button>
    </div>
  );
};