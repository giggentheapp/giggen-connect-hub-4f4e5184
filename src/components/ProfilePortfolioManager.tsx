import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Edit2, Save } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { useAppTranslation } from '@/hooks/useAppTranslation';
interface ProfilePortfolioItem {
  id: string;
  user_id: string;
  file_type: string;
  filename: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  title?: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
interface ProfilePortfolioManagerProps {
  userId: string;
  title: string;
  description: string;
}
const ProfilePortfolioManager = ({
  userId,
  title,
  description
}: ProfilePortfolioManagerProps) => {
  const [items, setItems] = useState<ProfilePortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const { toast } = useToast();
  const { t } = useAppTranslation();
  useEffect(() => {
    fetchItems();
  }, [userId]);
  
  const fetchItems = async () => {
    try {
      // Validate authentication before fetching
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('User not authenticated, skipping portfolio fetch');
        setLoading(false);
        return;
      }

      const {
        data,
        error
      } = await supabase.from('profile_portfolio').select('*').eq('user_id', userId).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching portfolio items:', error);
      toast({
        title: t('error'),
        description: t('couldNotLoadPortfolio'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleFileUploaded = async (fileData: any) => {
    try {
      // Validate authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Ikke innlogget",
          description: "Du må være innlogget for å laste opp filer",
          variant: "destructive"
        });
        return;
      }

      // Log the operation
      console.log('Portfolio upload operation', { 
        userId, 
        isAuthenticated: !!user,
        operation: 'upload',
        fileData: fileData.filename
      });

      const {
        data,
        error
      } = await supabase.from('profile_portfolio').insert({
        user_id: userId,
        file_type: fileData.file_type,
        filename: fileData.filename,
        file_path: fileData.file_path,
        file_url: fileData.publicUrl || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/portfolio/${fileData.file_path}`,
        file_size: fileData.file_size,
        mime_type: fileData.mime_type,
        title: fileData.filename,
        description: '',
        is_public: true
      }).select().single();
      if (error) throw error;
      setItems(prev => [data, ...prev]);
      toast({
        title: t('fileUploadSuccess'),
        description: t('fileAddedToPortfolio')
      });
    } catch (error: any) {
      toast({
        title: t('fileUploadError'),
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleUpdateItem = async (itemId: string) => {
    try {
      // Validate authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Ikke innlogget",
          description: "Du må være innlogget for å oppdatere filer",
          variant: "destructive"
        });
        return;
      }

      const {
        error
      } = await supabase.from('profile_portfolio').update({
        filename: editTitle || undefined,
        title: editTitle || undefined,
        description: editDescription || undefined
      }).eq('id', itemId);
      if (error) throw error;
      setItems(prev => prev.map(item => item.id === itemId ? {
        ...item,
        filename: editTitle || item.filename,
        title: editTitle || item.title,
        description: editDescription
      } : item));
      setEditingItem(null);
      setEditTitle('');
      setEditDescription('');
      toast({
        title: t('fileUpdateSuccess'),
        description: t('portfolioElementUpdated')
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: t('couldNotUpdateElement'),
        variant: "destructive"
      });
    }
  };
  const handleDeleteItem = async (itemId: string) => {
    try {
      // Validate authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Ikke innlogget",
          description: "Du må være innlogget for å slette filer",
          variant: "destructive"
        });
        return;
      }

      // Find the item to get the file_path before deleting
      const itemToDelete = items.find(item => item.id === itemId);
      if (!itemToDelete) {
        throw new Error('Fil ikke funnet');
      }

      // First, delete the file from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('portfolio')
        .remove([itemToDelete.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Then delete from database
      const { error: dbError } = await supabase
        .from('profile_portfolio')
        .delete()
        .eq('id', itemId);

      if (dbError) throw dbError;

      setItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: t('fileDeleteSuccess'),
        description: t('portfolioElementDeleted')
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: t('error'),
        description: error.message || t('couldNotDeleteElement'),
        variant: "destructive"
      });
    }
  };
  const startEditing = (item: ProfilePortfolioItem) => {
    setEditingItem(item.id);
    setEditTitle(item.title || item.filename);
    setEditDescription(item.description || '');
  };
  const cancelEditing = () => {
    setEditingItem(null);
    setEditTitle('');
    setEditDescription('');
  };
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
      </div>
      
      <FileUpload 
        fileType="portfolio" 
        folderPath={`portfolio/${userId}`} 
        onFileUploaded={handleFileUploaded} 
        acceptedTypes=".jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav,.pdf,.doc,.docx" 
      />

      {loading ? (
        <div className="text-center py-3 text-xs text-muted-foreground">{t('loadingPortfolio')}</div>
      ) : (
        <div className="space-y-2">
          {Array.isArray(items) ? items.filter(item => item && item.id).map(item => (
            <div key={item.id} className="border rounded p-2 bg-background">
              {editingItem === item.id ? (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="title" className="text-xs">{t('title')}</Label>
                    <Input 
                      id="title" 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-xs">{t('description')}</Label>
                    <Textarea 
                      id="description" 
                      value={editDescription} 
                      onChange={e => setEditDescription(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => handleUpdateItem(item.id)} className="h-7 text-xs">
                      <Save className="h-3 w-3 mr-1" />
                      {t('save')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing} className="h-7 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium truncate">{item.title || item.filename}</h4>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {item.file_type} • {new Date(item.created_at).toLocaleDateString('no-NO')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => startEditing(item)} className="h-6 w-6 p-0">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)} className="h-6 w-6 p-0 hover:bg-muted">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )) : []}
          {items.length === 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              {t('noPortfolioFiles')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ProfilePortfolioManager;