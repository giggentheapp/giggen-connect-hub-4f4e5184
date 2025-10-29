import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConceptTypeSelectorProps {
  onSelect: (type: 'session_musician' | 'teaching') => void;
}

export const ConceptTypeSelector = ({ onSelect }: ConceptTypeSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Velg tilbudstype</h2>
        <p className="text-muted-foreground">Hva slags tilbud vil du opprette?</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
          onClick={() => onSelect('session_musician')}
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

        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
          onClick={() => onSelect('teaching')}
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
