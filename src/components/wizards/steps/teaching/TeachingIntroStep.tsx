import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Calendar, Shield } from 'lucide-react';
import { WizardStepProps } from '../../BaseConceptWizard';

/**
 * TeachingIntroStep - Introduction screen for teaching wizard
 */
export const TeachingIntroStep = (_props: WizardStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold">Undervisningsavtale</h3>
                <p className="text-sm text-muted-foreground">
                  Opprett en strukturert avtale mellom deg og dine elever. Denne avtalen hjelper
                  med å sette klare forventninger og ansvar for begge parter.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold">For instruktører</h3>
                <p className="text-sm text-muted-foreground">
                  Definer undervisningstider, betalingsbetingelser, ansvar og forventninger.
                  Dette gir både deg og eleven en tydelig ramme for samarbeidet.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold">Fleksibilitet</h3>
                <p className="text-sm text-muted-foreground">
                  Du velger selv hvilke felter som skal inkluderes i avtalen. Tilpass den til
                  dine behov - aktiver kun de feltene som er relevante for din undervisning.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold">Profesjonelt oppsett</h3>
                <p className="text-sm text-muted-foreground">
                  Avtalen dekker viktige områder som ansvar, oppsigelse, forsikring og
                  kommunikasjon - alt for å sikre en god undervisningsopplevelse.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground text-center">
        <p>Trykk "Neste" for å begynne med tittelen og beskrivelsen</p>
      </div>
    </div>
  );
};
