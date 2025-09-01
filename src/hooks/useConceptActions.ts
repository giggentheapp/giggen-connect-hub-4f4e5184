import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConceptActionResult {
  success: boolean;
  error?: string;
}

export const useConceptActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const rejectConcept = async (
    conceptId: string, 
    rejectionReason?: string
  ): Promise<ConceptActionResult> => {
    try {
      setLoading(true);

      // First, get the current concept data
      const { data: concept, error: fetchError } = await supabase
        .from('concepts')
        .select('*')
        .eq('id', conceptId)
        .single();

      if (fetchError || !concept) {
        throw new Error('Kunne ikke hente konseptdata');
      }

      // Create history entry
      const { error: historyError } = await supabase
        .from('concepts_history')
        .insert({
          original_concept_id: concept.id,
          maker_id: concept.maker_id,
          title: concept.title,
          description: concept.description,
          status: 'rejected',
          price: concept.price,
          expected_audience: concept.expected_audience,
          tech_spec: concept.tech_spec,
          available_dates: concept.available_dates,
          rejected_by: (await supabase.auth.getUser()).data.user?.id,
          rejection_reason: rejectionReason,
          original_created_at: concept.created_at,
          original_data: concept
        });

      if (historyError) {
        throw historyError;
      }

      // Update concept status to rejected
      const { error: updateError } = await supabase
        .from('concepts')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', conceptId);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Konsept avvist",
        description: "Konseptet er flyttet til historikken",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error rejecting concept:', error);
      const errorMessage = error.message || 'Kunne ikke avvise konseptet';
      
      toast({
        title: "Feil ved avvisning",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteConcept = async (conceptId: string): Promise<ConceptActionResult> => {
    try {
      setLoading(true);

      // First, get the current concept data
      const { data: concept, error: fetchError } = await supabase
        .from('concepts')
        .select('*')
        .eq('id', conceptId)
        .single();

      if (fetchError || !concept) {
        throw new Error('Kunne ikke hente konseptdata');
      }

      // Create history entry
      const { error: historyError } = await supabase
        .from('concepts_history')
        .insert({
          original_concept_id: concept.id,
          maker_id: concept.maker_id,
          title: concept.title,
          description: concept.description,
          status: 'deleted',
          price: concept.price,
          expected_audience: concept.expected_audience,
          tech_spec: concept.tech_spec,
          available_dates: concept.available_dates,
          rejected_by: (await supabase.auth.getUser()).data.user?.id,
          rejection_reason: 'Slettet av bruker',
          original_created_at: concept.created_at,
          original_data: concept
        });

      if (historyError) {
        throw historyError;
      }

      // Delete concept files (cascade delete)
      const { error: filesError } = await supabase
        .from('concept_files')
        .delete()
        .eq('concept_id', conceptId);

      if (filesError) {
        throw filesError;
      }

      // Delete the concept
      const { error: conceptError } = await supabase
        .from('concepts')
        .delete()
        .eq('id', conceptId);

      if (conceptError) {
        throw conceptError;
      }

      toast({
        title: "Konsept slettet",
        description: "Konseptet er flyttet til historikken",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting concept:', error);
      const errorMessage = error.message || 'Kunne ikke slette konseptet';
      
      toast({
        title: "Feil ved sletting",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    rejectConcept,
    deleteConcept,
    loading
  };
};