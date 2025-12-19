import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  GraduationCap, Clock, MapPin, Banknote, Save, CheckCircle, 
  Plus, X, ChevronDown, ChevronUp, Settings, AlertTriangle, Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
  const [showFieldManager, setShowFieldManager] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const initialDataRef = useRef(teachingData);

  const isOwner = currentUserId === conceptData?.maker_id;
  const canEdit = isOwner;

  // Track changes from initial data
  useEffect(() => {
    initialDataRef.current = teachingData;
    setFormData(teachingData);
    setHasUnsavedChanges(false);
  }, [teachingData]);

  // Auto-save function for field toggles
  const autoSaveToggle = useCallback(async (updatedData: any) => {
    if (!canEdit || !conceptData?.id) return;

    setAutoSaving(true);
    try {
      const { error } = await supabase
        .from('concepts')
        .update({ teaching_data: updatedData })
        .eq('id', conceptData.id);

      if (error) throw error;
      
      toast.success('Felt-synlighet lagret', { duration: 1500 });
      initialDataRef.current = updatedData;
    } catch (error) {
      console.error('Auto-save error:', error);
      toast.error('Kunne ikke lagre endringen');
    } finally {
      setAutoSaving(false);
    }
  }, [canEdit, conceptData?.id]);

  // Toggle field enabled status - with auto-save
  const toggleFieldEnabled = useCallback((sectionKey: string, fieldId: string) => {
    setFormData((prev: any) => {
      const section = prev[sectionKey];
      if (!Array.isArray(section)) return prev;

      const updated = section.map((field: any) => 
        field.id === fieldId ? { ...field, enabled: !field.enabled } : field
      );

      const newData = { ...prev, [sectionKey]: updated };
      
      // Auto-save when toggling fields
      autoSaveToggle(newData);
      
      return newData;
    });
  }, [autoSaveToggle]);

  // Add custom field to a section
  const addCustomField = (sectionKey: string) => {
    setFormData((prev: any) => {
      const section = prev[sectionKey] || [];
      const newField = {
        id: `custom_${Date.now()}`,
        label: '',
        value: '',
        isCustom: true,
        enabled: true,
      };

      return { ...prev, [sectionKey]: [...section, newField] };
    });
    setHasUnsavedChanges(true);
  };

  // Remove custom field from a section
  const removeCustomField = (sectionKey: string, fieldId: string) => {
    setFormData((prev: any) => {
      const section = prev[sectionKey];
      if (!Array.isArray(section)) return prev;

      return { ...prev, [sectionKey]: section.filter((f: any) => f.id !== fieldId) };
    });
    setHasUnsavedChanges(true);
  };

  // Update custom field label
  const updateFieldLabel = (sectionKey: string, fieldId: string, newLabel: string) => {
    setFormData((prev: any) => {
      const section = prev[sectionKey];
      if (!Array.isArray(section)) return prev;

      const updated = section.map((field: any) => 
        field.id === fieldId ? { ...field, label: newLabel } : field
      );

      return { ...prev, [sectionKey]: updated };
    });
    setHasUnsavedChanges(true);
  };

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
    setHasUnsavedChanges(true);
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

      toast.success('Endringer lagret');
      setHasUnsavedChanges(false);
      initialDataRef.current = formData;
      onSaved();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Kunne ikke lagre endringene');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToApproval = async () => {
    // Save any pending changes first
    if (hasUnsavedChanges) {
      await handleSave();
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'approved_by_both' })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('Avtalen er nå klar for godkjenning fra begge parter');
      navigate(location.pathname + location.search, { replace: true });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Kunne ikke gå videre til godkjenning');
    } finally {
      setLoading(false);
    }
  };

  // Render section for editing - show ALL enabled fields (including empty ones when editing)
  const renderSection = (sectionKey: string, sectionTitle: string, icon: any) => {
    const sectionData = formData[sectionKey];
    if (!sectionData || !Array.isArray(sectionData)) return null;

    // FIXED: Show all enabled fields when editing, only filled fields when read-only
    const fieldsToShow = canEdit 
      ? sectionData.filter((field: any) => field.enabled)
      : sectionData.filter((field: any) => field.enabled && field.value);
    
    if (fieldsToShow.length === 0) return null;

    const Icon = icon;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{sectionTitle}</h3>
        </div>
        
        {fieldsToShow.map((field: any) => (
          <div key={field.id} className="space-y-2">
            {field.isCustom && canEdit ? (
              <div className="flex items-center gap-2">
                <Input
                  value={field.label || ''}
                  onChange={(e) => updateFieldLabel(sectionKey, field.id, e.target.value)}
                  placeholder="Feltnavn"
                  className="font-medium"
                />
                <Button variant="ghost" size="sm" onClick={() => removeCustomField(sectionKey, field.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Label>{field.label}</Label>
            )}
            {canEdit ? (
              <Textarea
                value={field.value || ''}
                onChange={(e) => updateFieldValue(sectionKey, field.id, e.target.value)}
                rows={3}
                className="w-full"
                placeholder="Fyll inn..."
              />
            ) : (
              <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
                {field.value || <span className="italic text-muted-foreground">Ikke utfylt</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render field manager for a section - with visual feedback
  const renderFieldManager = (sectionKey: string, sectionTitle: string) => {
    const sectionData = formData[sectionKey];
    if (!sectionData || !Array.isArray(sectionData)) return null;

    return (
      <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
        <h4 className="text-sm font-semibold">{sectionTitle}</h4>
        <div className="space-y-2">
          {sectionData.map((field: any) => (
            <div 
              key={field.id} 
              className={cn(
                "flex items-center gap-3 p-2 border rounded bg-background transition-opacity",
                !field.enabled && "opacity-60 bg-muted/50"
              )}
            >
              <Checkbox
                checked={field.enabled}
                onCheckedChange={() => toggleFieldEnabled(sectionKey, field.id)}
              />
              {field.isCustom ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={field.label || ''}
                    onChange={(e) => updateFieldLabel(sectionKey, field.id, e.target.value)}
                    placeholder="Feltnavn"
                    className={cn(
                      "text-sm",
                      !field.enabled && "opacity-50"
                    )}
                    disabled={!field.enabled}
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeCustomField(sectionKey, field.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "text-sm",
                    !field.enabled && "line-through text-muted-foreground"
                  )}>
                    {field.label}
                  </span>
                  {/* Value preview */}
                  {field.value && (
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      ({field.value.substring(0, 30)}{field.value.length > 30 ? '...' : ''})
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => addCustomField(sectionKey)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Legg til eget felt
        </Button>
      </div>
    );
  };

  // Section definitions for field manager
  const sections = [
    { key: 'schedule', title: 'Undervisningstider', icon: Clock },
    { key: 'payment', title: 'Betaling', icon: Banknote },
    { key: 'responsibilities', title: 'Ansvar og forventninger', icon: GraduationCap },
    { key: 'focus', title: 'Fokus og innhold', icon: GraduationCap },
    { key: 'termination', title: 'Oppsigelsesvilkår', icon: GraduationCap },
    { key: 'liability', title: 'Forsikring og ansvar', icon: GraduationCap },
    { key: 'communication', title: 'Kommunikasjon og avlysning', icon: GraduationCap },
  ];

  return (
    <div className="space-y-8">
      {/* Unsaved changes banner */}
      {hasUnsavedChanges && (
        <div className="flex items-center justify-between p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Du har ulagrede endringer</span>
          </div>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Lagre nå
              </>
            )}
          </Button>
        </div>
      )}

      {/* Auto-saving indicator */}
      {autoSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Auto-lagrer felt-synlighet...
        </div>
      )}

      {/* Field Manager Toggle for Owner */}
      {canEdit && (
        <Collapsible open={showFieldManager} onOpenChange={setShowFieldManager}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Administrer felt
              </div>
              {showFieldManager ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Her kan du aktivere/deaktivere felt eller legge til egne felt under forhandlingen.
              <br />
              <span className="text-xs">Felt-synlighet lagres automatisk.</span>
            </div>
            {sections.map(section => renderFieldManager(section.key, section.title))}
          </CollapsibleContent>
        </Collapsible>
      )}

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
          <Button 
            onClick={handleSave} 
            disabled={loading || !hasUnsavedChanges} 
            variant="outline"
          >
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
