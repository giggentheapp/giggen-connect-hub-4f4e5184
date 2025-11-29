import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Database } from "@/integrations/supabase/types";

type ConceptRow = Database['public']['Tables']['concepts']['Row'];
type ConceptInsert = Database['public']['Tables']['concepts']['Insert'];
type ConceptUpdate = Database['public']['Tables']['concepts']['Update'];
type ConceptFileRow = Database['public']['Tables']['concept_files']['Row'];

export interface CreateConceptInput {
  maker_id: string;
  title: string;
  description?: string;
  price?: number;
  expected_audience?: number;
  available_dates?: any;
  tech_spec?: string;
  tech_spec_reference?: string;
  hospitality_rider_reference?: string;
  door_deal?: boolean;
  door_percentage?: number;
  price_by_agreement?: boolean;
  concept_type?: string;
  teaching_data?: any;
  public_visibility_settings?: any;
}

export interface UpdateConceptInput {
  title?: string;
  description?: string;
  price?: number;
  expected_audience?: number;
  available_dates?: any;
  tech_spec?: string;
  tech_spec_reference?: string;
  hospitality_rider_reference?: string;
  door_deal?: boolean;
  door_percentage?: number;
  price_by_agreement?: boolean;
  concept_type?: string;
  teaching_data?: any;
  public_visibility_settings?: any;
  status?: string;
  is_published?: boolean;
}

export const conceptService = {
  /**
   * Get a concept by ID
   */
  async getById(conceptId: string, includeDrafts: boolean = false): Promise<ConceptRow | null> {
    try {
      let query = supabase
        .from('concepts')
        .select('*')
        .eq('id', conceptId);

      if (!includeDrafts) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - not an error, just return null
          return null;
        }
        logger.error('Failed to fetch concept', { conceptId, error });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in getById', { conceptId, error });
      throw error;
    }
  },

  /**
   * Get all concepts for a user
   */
  async getUserConcepts(userId: string, includeDrafts: boolean = false): Promise<ConceptRow[]> {
    try {
      let query = supabase
        .from('concepts')
        .select('*')
        .eq('maker_id', userId)
        .order('created_at', { ascending: false });

      if (!includeDrafts) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch user concepts', { userId, error });
        throw error;
      }

      logger.business('Fetched user concepts', {
        userId,
        total: data?.length || 0,
        published: data?.filter(c => c.is_published).length || 0,
        unpublished: data?.filter(c => !c.is_published).length || 0,
      });

      return data || [];
    } catch (error) {
      logger.error('Error in getUserConcepts', { userId, error });
      return [];
    }
  },

  /**
   * Get all files for a concept
   */
  async getConceptFiles(conceptId: string): Promise<ConceptFileRow[]> {
    try {
      const { data, error } = await supabase
        .from('concept_files')
        .select('*')
        .eq('concept_id', conceptId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch concept files', { conceptId, error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getConceptFiles', { conceptId, error });
      return [];
    }
  },

  /**
   * Create a new concept
   */
  async create(conceptData: CreateConceptInput): Promise<ConceptRow> {
    try {
      logger.business('Creating new concept', {
        maker_id: conceptData.maker_id,
        title: conceptData.title,
        concept_type: conceptData.concept_type,
      });

      const { data, error } = await supabase
        .from('concepts')
        .insert({
          maker_id: conceptData.maker_id,
          title: conceptData.title,
          description: conceptData.description || null,
          price: conceptData.price || null,
          expected_audience: conceptData.expected_audience || null,
          available_dates: conceptData.available_dates || null,
          tech_spec: conceptData.tech_spec || null,
          tech_spec_reference: conceptData.tech_spec_reference || null,
          hospitality_rider_reference: conceptData.hospitality_rider_reference || null,
          door_deal: conceptData.door_deal || false,
          door_percentage: conceptData.door_percentage || null,
          price_by_agreement: conceptData.price_by_agreement || false,
          concept_type: conceptData.concept_type || 'session_musician',
          teaching_data: conceptData.teaching_data || null,
          public_visibility_settings: conceptData.public_visibility_settings || {},
          is_published: false,
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create concept', { conceptData, error });
        throw error;
      }

      logger.business('Concept created successfully', { conceptId: data.id });

      return data;
    } catch (error) {
      logger.error('Error in create', { conceptData, error });
      throw error;
    }
  },

  /**
   * Update an existing concept
   */
  async update(conceptId: string, updates: UpdateConceptInput): Promise<ConceptRow> {
    try {
      logger.business('Updating concept', { conceptId, updates });

      const { data, error } = await supabase
        .from('concepts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conceptId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update concept', { conceptId, updates, error });
        throw error;
      }

      logger.business('Concept updated successfully', { conceptId });

      return data;
    } catch (error) {
      logger.error('Error in update', { conceptId, updates, error });
      throw error;
    }
  },

  /**
   * Publish a concept
   */
  async publish(conceptId: string): Promise<ConceptRow> {
    try {
      logger.business('Publishing concept', { conceptId });

      const { data, error } = await supabase
        .from('concepts')
        .update({
          is_published: true,
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conceptId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to publish concept', { conceptId, error });
        throw error;
      }

      logger.business('Concept published successfully', { conceptId });

      return data;
    } catch (error) {
      logger.error('Error in publish', { conceptId, error });
      throw error;
    }
  },

  /**
   * Delete a concept
   */
  async delete(conceptId: string): Promise<void> {
    try {
      logger.business('Deleting concept', { conceptId });

      // Hard delete - will cascade delete related files via database constraints
      const { error } = await supabase
        .from('concepts')
        .delete()
        .eq('id', conceptId);

      if (error) {
        logger.error('Failed to delete concept', { conceptId, error });
        throw error;
      }

      logger.business('Concept deleted successfully', { conceptId });
    } catch (error) {
      logger.error('Error in delete', { conceptId, error });
      throw error;
    }
  },
};
