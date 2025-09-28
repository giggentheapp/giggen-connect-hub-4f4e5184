import { useNavigate } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useAppTranslation';

export default function Map() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Minimal content - feedback button is automatically included from App.tsx */}
    </div>
  );
}