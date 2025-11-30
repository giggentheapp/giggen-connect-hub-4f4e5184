import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, GraduationCap, ArrowLeft, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoleData } from '@/hooks/useRole';

interface ConceptTypeSelectorProps {
  onSelect: (type: 'session_musician' | 'teaching' | 'arrangør_tilbud') => void;
  onBack?: () => void;
}

export const ConceptTypeSelector = ({ onSelect, onBack }: ConceptTypeSelectorProps) => {
  const { isOrganizer, isMusician, loading } = useRoleData();

  const handleSelect = (type: 'session_musician' | 'teaching' | 'arrangør_tilbud') => {
    console.log('ConceptTypeSelector: Selected type:', type);
    console.log('ConceptTypeSelector: isMusician:', isMusician);
    console.log('ConceptTypeSelector: isOrganizer:', isOrganizer);
    onSelect(type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Laster...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>
      )}
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Velg tilbudstype</h2>
        <p className="text-muted-foreground">Hva slags tilbud vil du opprette?</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Session Musiker - kun for musikere */}
        {isMusician && (
          <Card
          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
          onClick={() => handleSelect('session_musician')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Session Musiker</CardTitle>
            <CardDescription>
              Opptre som musiker på arrangementer, konserter og andre events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Definer pris og betingelser</li>
              <li>• Last opp portefølje</li>
              <li>• Tech spec og rider</li>
              <li>• Tilgjengelige datoer</li>
            </ul>
          </CardContent>
        </Card>
        )}

        {/* Arrangør Tilbud - kun for arrangører */}
        {isOrganizer && (
          <Card 
            className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
            onClick={() => handleSelect('arrangør_tilbud')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Arrangør Tilbud</CardTitle>
              <CardDescription>
                Lag et tilbud for faste programmer som musikere kan søke seg inn på
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Beskriv programtypen (quiz, standup, jam osv.)</li>
                <li>• Definer betingelser og forventninger</li>
                <li>• Last opp relevant informasjon</li>
                <li>• Angi datoer og frekvens</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Undervisning/Kurs - for alle */}
        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
          onClick={() => handleSelect('teaching')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Undervisning/Kurs</CardTitle>
            <CardDescription>
              Lag en profesjonell undervisningsavtale for musikk- eller kursledelse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Kontaktinformasjon</li>
              <li>• Undervisningstider og betingelser</li>
              <li>• Betalingsbetingelser</li>
              <li>• Ansvar og forventninger</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
