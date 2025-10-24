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
  usage_type: 'profile_portfolio' | 'tech_spec' | 'hospitality_rider' | 'band_portfolio' | 'band_tech_spec' | 'band_hospitality';
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
      // Delete from storage
      const bucket = filePath.split('/')[0];
      const path = filePath.substring(filePath.indexOf('/') + 1);
      
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (storageError) throw storageError;

      // Delete from database (cascade will handle file_usage)
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      await fetchFiles();
    } catch (err: unknown) {
      logger.error('Failed to delete file', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  return { files, loading, error, refetch: fetchFiles, deleteFile };
};
