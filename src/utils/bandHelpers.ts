import { Crown, Shield } from 'lucide-react';

export const getRoleIcon = (role: string) => {
  switch (role) {
    case 'founder':
      return Crown;
    case 'admin':
      return Shield;
    default:
      return null;
  }
};

export const getRoleBadgeText = (role: string): string => {
  switch (role) {
    case 'founder':
      return 'Grunnlegger';
    case 'admin':
      return 'Admin';
    case 'member':
      return 'Medlem';
    default:
      return '';
  }
};

export const getRoleVariant = (role: string): 'default' | 'secondary' | 'outline' => {
  switch (role) {
    case 'founder':
      return 'default';
    case 'admin':
      return 'secondary';
    default:
      return 'outline';
  }
};
