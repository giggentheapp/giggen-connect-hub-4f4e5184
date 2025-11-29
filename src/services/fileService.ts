import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Database } from "@/integrations/supabase/types";

type UserFileRow = Database['public']['Tables']['user_files']['Row'];
type ConceptFileRow = Database['public']['Tables']['concept_files']['Row'];
type ProfilePortfolioRow = Database['public']['Tables']['profile_portfolio']['Row'];
type ProfileTechSpecRow = Database['public']['Tables']['profile_tech_specs']['Row'];
type HospitalityRiderRow = Database['public']['Tables']['hospitality_riders']['Row'];

export interface UploadResult {
  path: string;
  url: string;
}

export const fileService = {
  /**
   * Get files for a user profile with optional type filter
   */
  async getProfileFiles(userId: string, fileType?: string): Promise<UserFileRow[]> {
    try {
      let query = supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fileType) {
        query = query.eq('file_type', fileType);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch profile files', { userId, fileType, error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getProfileFiles', { userId, fileType, error });
      return [];
    }
  },

  /**
   * Get portfolio files for a user (from profile_portfolio table)
   */
  async getPortfolioFiles(userId: string): Promise<ProfilePortfolioRow[]> {
    try {
      const { data, error } = await supabase
        .from('profile_portfolio')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch portfolio files', { userId, error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getPortfolioFiles', { userId, error });
      return [];
    }
  },

  /**
   * Get tech spec files for a user
   */
  async getTechSpecFiles(userId: string): Promise<ProfileTechSpecRow[]> {
    try {
      const { data, error } = await supabase
        .from('profile_tech_specs')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Failed to fetch tech spec files', { userId, error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getTechSpecFiles', { userId, error });
      return [];
    }
  },

  /**
   * Get hospitality rider files for a user
   */
  async getHospitalityRiders(userId: string): Promise<HospitalityRiderRow[]> {
    try {
      const { data, error } = await supabase
        .from('hospitality_riders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Failed to fetch hospitality riders', { userId, error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getHospitalityRiders', { userId, error });
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
   * Upload a file to Supabase Storage
   */
  async uploadFile(bucket: string, file: File, path: string): Promise<UploadResult> {
    try {
      logger.business('Uploading file to storage', {
        bucket,
        fileName: file.name,
        fileSize: file.size,
        path,
      });

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        logger.error('Failed to upload file', { bucket, path, error });
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      logger.business('File uploaded successfully', {
        bucket,
        path: data.path,
        url: urlData.publicUrl,
      });

      return {
        path: data.path,
        url: urlData.publicUrl,
      };
    } catch (error) {
      logger.error('Error in uploadFile', { bucket, path, error });
      throw error;
    }
  },

  /**
   * Delete a file from both database and storage
   */
  async deleteFile(fileId: string, bucket: string, filePath: string): Promise<void> {
    try {
      logger.business('Deleting file', { fileId, bucket, filePath });

      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) {
        logger.error('Failed to delete file from storage', { bucket, filePath, error: storageError });
        throw storageError;
      }

      // Delete from database (will cascade delete file_usage entries)
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        logger.error('Failed to delete file from database', { fileId, error: dbError });
        throw dbError;
      }

      logger.business('File deleted successfully', { fileId, bucket, filePath });
    } catch (error) {
      logger.error('Error in deleteFile', { fileId, bucket, filePath, error });
      throw error;
    }
  },

  /**
   * Delete a portfolio file
   */
  async deletePortfolioFile(fileId: string): Promise<void> {
    try {
      logger.business('Deleting portfolio file', { fileId });

      const { error } = await supabase
        .rpc('delete_portfolio_file', { file_id: fileId });

      if (error) {
        logger.error('Failed to delete portfolio file', { fileId, error });
        throw error;
      }

      logger.business('Portfolio file deleted successfully', { fileId });
    } catch (error) {
      logger.error('Error in deletePortfolioFile', { fileId, error });
      throw error;
    }
  },

  /**
   * Delete a tech spec file
   */
  async deleteTechSpecFile(fileId: string): Promise<void> {
    try {
      logger.business('Deleting tech spec file', { fileId });

      const { error } = await supabase
        .rpc('delete_tech_spec_file', { file_id: fileId });

      if (error) {
        logger.error('Failed to delete tech spec file', { fileId, error });
        throw error;
      }

      logger.business('Tech spec file deleted successfully', { fileId });
    } catch (error) {
      logger.error('Error in deleteTechSpecFile', { fileId, error });
      throw error;
    }
  },

  /**
   * Delete a hospitality rider file
   */
  async deleteHospitalityRider(fileId: string): Promise<void> {
    try {
      logger.business('Deleting hospitality rider', { fileId });

      const { error } = await supabase
        .rpc('delete_hospitality_rider', { file_id: fileId });

      if (error) {
        logger.error('Failed to delete hospitality rider', { fileId, error });
        throw error;
      }

      logger.business('Hospitality rider deleted successfully', { fileId });
    } catch (error) {
      logger.error('Error in deleteHospitalityRider', { fileId, error });
      throw error;
    }
  },
};
