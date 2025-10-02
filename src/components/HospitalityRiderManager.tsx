import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Edit2, Save } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface HospitalityRiderItem {
  id: string;
  user_id: string;
  filename: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface HospitalityRiderManagerProps {
  userId: string;
  title: string;
  description: string;
}

const HospitalityRiderManager = ({ userId, title, description }: HospitalityRiderManagerProps) => {
  const [items, setItems] = useState<HospitalityRiderItem[]>([]);
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
        .from('hospitality_riders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching hospitality riders:', error);
      toast({
        title: t('error'),
        description: t('couldNotLoadHospitalityRiders'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = (fileData: any) => {
    // FileUpload component now handles database insertion directly for hospitality riders
    setItems(prev => [fileData, ...prev]);
    toast({
      title: t('hospitalityRiderUploaded'),
      description: t('hospitalityRiderReady'),
    });
  };

  const handleUpdateItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('hospitality_riders')
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
        description: t('hospitalityRiderNameUpdated'),
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: t('couldNotUpdateHospitalityRider'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('hospitality_riders')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: t('fileDeleteSuccess'),
        description: t('hospitalityRiderDeleted'),
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: t('couldNotDeleteHospitalityRider'),
        variant: "destructive",
      });
    }
  };

  const startEditing = (item: HospitalityRiderItem) => {
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
        fileType="hospitality"
        folderPath={userId}
        onFileUploaded={handleFileUploaded}
        acceptedTypes=".pdf,.doc,.docx,.txt,.md"
        targetTable="hospitality_riders"
      />

      {loading ? (
        <div className="text-center py-3 text-xs text-muted-foreground">{t('loadingHospitalityRiders')}</div>
      ) : (
        <div className="space-y-2">
          {Array.isArray(items) ? items.filter(item => item && item.id).map((item) => (
            <div key={item.id} className="border rounded p-2 bg-background">
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
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium truncate">{item.filename}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {item.file_type} • {new Date(item.created_at).toLocaleDateString('no-NO')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(item)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-6 w-6 p-0 hover:bg-muted"
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
              {t('noHospitalityFiles')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HospitalityRiderManager;