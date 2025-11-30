import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { WizardStepProps } from '../BaseConceptWizard';
import { CheckCircle, Calendar, Users, DollarSign, FileText } from 'lucide-react';

/**
 * PreviewStep - Summary of all entered data before publishing
 */
export const PreviewStep = ({ data }: WizardStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Grunnleggende informasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tittel</p>
            <p className="text-lg font-semibold">{data.title || 'Ingen tittel'}</p>
          </div>
          {data.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Beskrivelse</p>
              <p className="text-sm">{data.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Pris og publikum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Prismodell</p>
            <div className="mt-1">
              {data.pricing_type === 'fixed' && (
                <Badge variant="secondary">Fast pris: {data.price} NOK</Badge>
              )}
              {data.pricing_type === 'door_deal' && (
                <Badge variant="secondary">
                  Døravtale: {data.door_percentage}% av billettinntekter
                </Badge>
              )}
              {data.pricing_type === 'by_agreement' && (
                <Badge variant="secondary">Etter avtale</Badge>
              )}
            </div>
          </div>
          {data.expected_audience && (
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Forventet publikum
              </p>
              <p className="text-sm">{data.expected_audience} personer</p>
            </div>
          )}
        </CardContent>
      </Card>

      {(data.portfolio_files?.length > 0 ||
        data.selected_tech_spec_file ||
        data.selected_hospitality_rider_file) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Filer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.portfolio_files?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio</p>
                <p className="text-sm">{data.portfolio_files.length} fil(er)</p>
              </div>
            )}
            {data.selected_tech_spec_file && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tech spec</p>
                <Badge variant="outline">Valgt</Badge>
              </div>
            )}
            {data.selected_hospitality_rider_file && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Hospitality rider
                </p>
                <Badge variant="outline">Valgt</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Tilgjengelighet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.is_indefinite ? (
            <Badge variant="secondary">Tilgjengelig hele tiden</Badge>
          ) : data.available_dates?.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {data.available_dates.length} dato(er) valgt
              </p>
              <div className="flex flex-wrap gap-2">
                {data.available_dates.slice(0, 5).map((date: Date, index: number) => (
                  <Badge key={index} variant="outline">
                    {date.toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Badge>
                ))}
                {data.available_dates.length > 5 && (
                  <Badge variant="outline">+{data.available_dates.length - 5} til</Badge>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ingen datoer valgt</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-center text-muted-foreground">
          Når du publiserer vil tilbudet bli synlig for arrangører som søker etter musikere
        </p>
      </div>
    </div>
  );
};
