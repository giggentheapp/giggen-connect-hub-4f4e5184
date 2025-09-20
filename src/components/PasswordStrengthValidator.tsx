import React from 'react';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met?: boolean;
}

interface PasswordStrengthValidatorProps {
  password: string;
  onPasswordChange: (password: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  className?: string;
  placeholder?: string;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: 'Minst 8 tegn',
    test: (password: string) => password.length >= 8
  },
  {
    label: 'Minst én stor bokstav',
    test: (password: string) => /[A-Z]/.test(password)
  },
  {
    label: 'Minst én liten bokstav',
    test: (password: string) => /[a-z]/.test(password)
  },
  {
    label: 'Minst ett tall',
    test: (password: string) => /\d/.test(password)
  },
  {
    label: 'Minst ett spesialtegn (!@#$%^&*)',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
];

export const PasswordStrengthValidator: React.FC<PasswordStrengthValidatorProps> = ({
  password,
  onPasswordChange,
  showPassword,
  onToggleShowPassword,
  className = '',
  placeholder = 'Skriv inn passord...'
}) => {
  const requirementsWithStatus = passwordRequirements.map(req => ({
    ...req,
    met: req.test(password)
  }));

  const isPasswordValid = requirementsWithStatus.every(req => req.met);
  const strengthScore = requirementsWithStatus.filter(req => req.met).length;

  const getStrengthColor = () => {
    if (strengthScore === 0) return 'text-muted-foreground';
    if (strengthScore <= 2) return 'text-destructive';
    if (strengthScore <= 4) return 'text-warning';
    return 'text-success';
  };

  const getStrengthLabel = () => {
    if (strengthScore === 0) return '';
    if (strengthScore <= 2) return 'Svakt';
    if (strengthScore <= 4) return 'Middels';
    return 'Sterkt';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Password Input */}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleShowPassword}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-muted/50"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>

      {/* Password Strength Indicator */}
      {password && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Passordstyrke:</span>
            <span className={`text-sm font-medium ${getStrengthColor()}`}>
              {getStrengthLabel()}
            </span>
          </div>
          
          {/* Strength Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                strengthScore <= 2 
                  ? 'bg-destructive' 
                  : strengthScore <= 4 
                  ? 'bg-warning' 
                  : 'bg-success'
              }`}
              style={{ width: `${(strengthScore / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Requirements List */}
      {password && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Passordkrav:</p>
          <div className="space-y-1">
            {requirementsWithStatus.map((req, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  req.met ? 'text-success' : 'text-muted-foreground'
                }`}
              >
                {req.met ? (
                  <Check size={14} className="text-success" />
                ) : (
                  <X size={14} className="text-muted-foreground" />
                )}
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Notice */}
      {password && isPasswordValid && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <p className="text-sm text-success">
            ✅ Passordet oppfyller alle sikkerhetskrav
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthValidator;