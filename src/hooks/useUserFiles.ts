import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface UserFile {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  file_url: string | null;
  file_type: string;
  file_size: number | null;
  mime_type: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface FileUsage {
  id: string;
  file_id: string;
  usage_type: 'profile_portfolio' | 'tech_spec' | 'hospitality_rider' | 'band_portfolio' | 'band_tech_spec' | 'band_hospitality' | 'band_logo' | 'band_banner';
  reference_id: string | null;
  created_at: string;
}

export interface FileWithUsage extends UserFile {
  usage: FileUsage[];
}

export const useUserFiles = (userId: string | undefined) => {
  const [files, setFiles] = useState<FileWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!userId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all user files
      const { data: filesData, error: filesError } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filesError) throw filesError;

      // Fetch usage for all files
      const fileIds = filesData?.map(f => f.id) || [];
      let usageData: FileUsage[] = [];
      
      if (fileIds.length > 0) {
        const { data: usage, error: usageError } = await supabase
          .from('file_usage')
          .select('*')
          .in('file_id', fileIds);

        if (usageError) throw usageError;
        usageData = (usage || []) as FileUsage[];
      }

      // Combine files with their usage
      const filesWithUsage: FileWithUsage[] = (filesData || []).map(file => ({
        ...file,
        usage: usageData.filter(u => u.file_id === file.id)
      }));

      setFiles(filesWithUsage);
    } catch (err: unknown) {
      logger.error('Failed to fetch user files', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    try {
      console.log('Deleting file:', fileId, filePath);
      
      // All files now in filbank bucket
      const bucket = 'filbank';
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;
      console.log('File URL to remove:', fileUrl);

      // First, remove all references to this file in bands table (logo and banner)
      // We need to check both exact match and partial match (in case of different URL formats)
      const { data: allBands, error: bandsError } = await supabase
        .from('bands')
        .select('id, image_url, banner_url');

      if (bandsError) {
        console.error('Error fetching bands:', bandsError);
      } else if (allBands) {
        console.log('Checking', allBands.length, 'bands for file usage');
        for (const band of allBands) {
          const updates: any = {};
          
          // Check if image_url contains the file path
          if (band.image_url && (band.image_url === fileUrl || band.image_url.includes(filePath))) {
            updates.image_url = null;
            console.log('Removing logo from band:', band.id);
          }
          
          // Check if banner_url contains the file path
          if (band.banner_url && (band.banner_url === fileUrl || band.banner_url.includes(filePath))) {
            updates.banner_url = null;
            console.log('Removing banner from band:', band.id);
          }
          
          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
              .from('bands')
              .update(updates)
              .eq('id', band.id);
              
            if (updateError) {
              console.error('Error updating band:', updateError);
            } else {
              console.log('Successfully updated band:', band.id);
            }
          }
        }
      }

      // Get all usages of this file from file_usage table
      const { data: usages } = await supabase
        .from('file_usage')
        .select('*')
        .eq('file_id', fileId);

      console.log('File usages found:', usages?.length || 0);

      // Remove file references from all places it's used
      if (usages && usages.length > 0) {
        for (const usage of usages) {
          console.log('Removing usage:', usage.usage_type, usage.reference_id);
          
          if (usage.usage_type === 'band_tech_spec') {
            await supabase.from('band_tech_specs').delete().eq('file_path', filePath);
          } else if (usage.usage_type === 'band_hospitality') {
            await supabase.from('band_hospitality').delete().eq('file_path', filePath);
          } else if (usage.usage_type === 'band_portfolio') {
            await supabase.from('band_portfolio').delete().eq('file_path', filePath);
          } else if (usage.usage_type === 'profile_portfolio') {
            await supabase.from('profile_portfolio').delete().eq('file_path', filePath);
          } else if (usage.usage_type === 'tech_spec') {
            await supabase.from('profile_tech_specs').delete().eq('file_path', filePath);
          } else if (usage.usage_type === 'hospitality_rider') {
            await supabase.from('hospitality_riders').delete().eq('file_path', filePath);
          } else if (usage.usage_type === 'band_logo' && usage.reference_id) {
            // Remove band logo
            await supabase
              .from('bands')
              .update({ image_url: null })
              .eq('id', usage.reference_id);
          } else if (usage.usage_type === 'band_banner' && usage.reference_id) {
            // Remove band banner
            await supabase
              .from('bands')
              .update({ banner_url: null })
              .eq('id', usage.reference_id);
          }
        }
      }

      // Delete from storage (now always from filbank)
      console.log('Deleting from storage...');
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        throw storageError;
      }

      // Delete from database (cascade will handle file_usage)
      console.log('Deleting from user_files table...');
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw dbError;
      }

      console.log('File deleted successfully');
      await fetchFiles();
    } catch (err: unknown) {
      logger.error('Failed to delete file', err);
      console.error('Delete file error:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  return { files, loading, error, refetch: fetchFiles, deleteFile };
};
