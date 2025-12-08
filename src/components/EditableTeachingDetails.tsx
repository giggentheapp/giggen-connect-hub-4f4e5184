import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, Clock, MapPin, Banknote, Save, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditableTeachingDetailsProps {
  booking: any;
  conceptData: any;
  currentUserId: string;
  onSaved: () => void;
}

export const EditableTeachingDetails = ({ 
  booking, 
  conceptData, 
  currentUserId,
  onSaved 
}: EditableTeachingDetailsProps) => {
  const teachingData = conceptData?.teaching_data || {};
  const [formData, setFormData] = useState(teachingData);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isOwner = currentUserId === conceptData?.maker_id;
  const canEdit = isOwner;

  // Helper to update field values
  const updateFieldValue = (sectionKey: string, fieldId: string, newValue: string) => {
    setFormData((prev: any) => {
      const section = prev[sectionKey];
      if (!Array.isArray(section)) return prev;

      const updated = section.map((field: any) => 
        field.id === fieldId ? { ...field, value: newValue } : field
      );

      return { ...prev, [sectionKey]: updated };
    });
  };

  const handleSave = async () => {
    if (!canEdit) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('concepts')
        .update({ teaching_data: formData })
        .eq('id', conceptData.id);

      if (error) throw error;

      toast({
        title: "Endringer lagret",
        description: "Undervisningsdetaljer har blitt oppdatert",
      });

      onSaved();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre endringene",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToApproval = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'approved_by_both' })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Klar for godkjenning",
        description: "Avtalen er nå klar for godkjenning fra begge parter",
      });

      // Navigate to same page to refresh data (use replace: true to avoid adding to history)
      navigate(location.pathname + location.search, { replace: true });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke gå videre til godkjenning",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Render fields for a section
  const renderSection = (sectionKey: string, sectionTitle: string, icon: any) => {
    const sectionData = formData[sectionKey];
    if (!sectionData || !Array.isArray(sectionData)) return null;

    const enabledFields = sectionData.filter((field: any) => field.enabled && field.value);
    if (enabledFields.length === 0) return null;

    const Icon = icon;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{sectionTitle}</h3>
        </div>
        
        {enabledFields.map((field: any) => (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            {canEdit ? (
              <Textarea
                value={field.value || ''}
                onChange={(e) => updateFieldValue(sectionKey, field.id, e.target.value)}
                rows={3}
                className="w-full"
              />
            ) : (
              <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
                {field.value}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Grunnleggende informasjon</h3>
        </div>
        
        <div>
          <Label>Tittel</Label>
          <div className="p-3 border rounded bg-muted/30 text-sm">
            {booking.title}
          </div>
        </div>
        
        {booking.description && (
          <div>
            <Label>Beskrivelse</Label>
            <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
              {booking.description}
            </div>
          </div>
        )}
      </div>

      {/* Teaching Schedule */}
      {renderSection('schedule', 'Undervisningstider', Clock)}

      {/* Start Date */}
      {teachingData.start_date && (
        <div className="space-y-2">
          <Label>Startdato</Label>
          <div className="p-3 border rounded bg-muted/30 text-sm">
            {(() => {
              try {
                return format(new Date(teachingData.start_date), 'dd.MM.yyyy');
              } catch (error) {
                return teachingData.start_date;
              }
            })()}
          </div>
        </div>
      )}

      {/* Duration */}
      {renderSection('duration', 'Varighet', Clock)}

      {/* Location */}
      {renderSection('location', 'Sted', MapPin)}

      {/* Payment */}
      {renderSection('payment', 'Betaling', Banknote)}

      {/* Responsibilities */}
      {renderSection('responsibilities', 'Ansvar og forventninger', GraduationCap)}

      {/* Focus */}
      {renderSection('focus', 'Fokus og innhold', GraduationCap)}

      {/* Termination */}
      {renderSection('termination', 'Oppsigelsesvilkår', GraduationCap)}

      {/* Liability */}
      {renderSection('liability', 'Forsikring og ansvar', GraduationCap)}

      {/* Communication */}
      {renderSection('communication', 'Kommunikasjon og avlysning', GraduationCap)}

      {/* Save Button */}
      {canEdit && (
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={loading} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Lagrer...' : 'Lagre endringer'}
          </Button>
          <Button onClick={handleProceedToApproval} disabled={loading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Send til godkjenning
          </Button>
        </div>
      )}

      {!canEdit && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          💡 Kun eieren av tilbudet kan redigere disse detaljene.
        </div>
      )}
    </div>
  );
};
