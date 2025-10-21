import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Edit2, Save, FileText } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface TechSpecItem {
  id: string;
  profile_id: string;
  filename: string;
  file_url: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

interface TechSpecManagerProps {
  userId: string;
  title: string;
  description: string;
}

const TechSpecManager = ({ userId, title, description }: TechSpecManagerProps) => {
  const [items, setItems] = useState<TechSpecItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const { toast } = useToast();
  const { t } = useAppTranslation();

  useEffect(() => {
    fetchItems();
  }, [userId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_tech_specs')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching tech specs:', error);
      toast({
        title: t('error'),
        description: t('couldNotLoadTechSpecs'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = (fileData: any) => {
    // FileUpload component now handles database insertion directly for tech specs
    setItems(prev => [fileData, ...prev]);
    toast({
      title: t('techSpecUploaded'),
      description: t('techSpecReady'),
    });
  };

  const handleUpdateItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('profile_tech_specs')
        .update({
          filename: editName
        })
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, filename: editName }
          : item
      ));

      setEditingItem(null);
      setEditName('');

      toast({
        title: t('fileUpdateSuccess'),
        description: t('techSpecNameUpdated'),
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: t('couldNotUpdateTechSpec'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      // Find the item to get file_path
      const itemToDelete = items.find(item => item.id === itemId);
      if (!itemToDelete) {
        throw new Error('Fil ikke funnet');
      }

      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('tech-specs')
        .remove([itemToDelete.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Then use database function
      const { error } = await supabase.rpc('delete_tech_spec_file', {
        file_id: itemId
      });

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: t('fileDeleteSuccess'),
        description: t('techSpecDeleted'),
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: t('couldNotDeleteTechSpec'),
        variant: "destructive",
      });
    }
  };

  const startEditing = (item: TechSpecItem) => {
    setEditingItem(item.id);
    setEditName(item.filename);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditName('');
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
      </div>
      
      <FileUpload
        fileType="tech-spec"
        folderPath={userId}
        onFileUploaded={handleFileUploaded}
        acceptedTypes=".pdf,.doc,.docx,.txt,.md"
        targetTable="profile_tech_specs"
      />

      {loading ? (
        <div className="text-center py-3 text-xs text-muted-foreground">{t('loadingTechSpecs')}</div>
      ) : (
        <div className="space-y-2">
          {Array.isArray(items) ? items.filter(item => item && item.id).map((item) => (
            <div key={item.id} className="group relative rounded-lg border border-border/40 bg-gradient-to-br from-background to-muted/20 p-3 hover:border-border transition-all">
              {editingItem === item.id ? (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="name" className="text-xs">{t('fileName')}</Label>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateItem(item.id)}
                      className="h-7 text-xs"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {t('save')}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={cancelEditing}
                      className="h-7 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-accent-purple" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.filename}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-purple"></span>
                      {item.file_type} • {new Date(item.created_at).toLocaleDateString('no-NO')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(item)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-7 w-7 p-0 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )) : []}
          {items.length === 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              {t('noTechSpecFiles')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TechSpecManager;