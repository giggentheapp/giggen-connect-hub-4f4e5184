import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Edit2, Save, FileText, FolderOpen } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useUserFiles } from '@/hooks/useUserFiles';
import { FileSelectionModal } from '@/components/FileSelectionModal';

interface BandHospitalityItem {
  id: string;
  band_id: string;
  filename: string;
  file_url: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

interface BandHospitalityManagerProps {
  userId: string;
  bandId: string;
  title: string;
  description: string;
}

const BandHospitalityManager = ({ userId, bandId, title, description }: BandHospitalityManagerProps) => {
  const [items, setItems] = useState<BandHospitalityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showFileModal, setShowFileModal] = useState(false);
  const { toast } = useToast();
  const { t } = useAppTranslation();
  const { files: userFiles } = useUserFiles(userId);

  useEffect(() => {
    fetchItems();
  }, [bandId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('band_hospitality')
        .select('*')
        .eq('band_id', bandId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching band hospitality riders:', error);
      toast({
        title: t('error'),
        description: 'Kunne ikke laste hospitality riders',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelected = async (file: any) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Ikke innlogget",
          variant: "destructive"
        });
        return;
      }

      // Generate public URL if file_url is missing
      let fileUrl = file.file_url;
      if (!fileUrl) {
        const bucket = file.file_path.split('/')[0];
        const path = file.file_path.substring(file.file_path.indexOf('/') + 1);
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        fileUrl = data.publicUrl;
      }

      // Add to file_usage
      const { error: usageError } = await supabase
        .from('file_usage')
        .insert({
          file_id: file.id,
          usage_type: 'band_hospitality',
          reference_id: bandId
        });

      if (usageError) throw usageError;

      // Create band hospitality rider entry
      const riderData = {
        band_id: bandId,
        filename: file.filename,
        file_path: file.file_path,
        file_url: fileUrl,
        file_type: file.file_type,
        file_size: file.file_size,
        mime_type: file.mime_type
      };

      const { data, error } = await supabase
        .from('band_hospitality')
        .insert(riderData)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      toast({
        title: 'Hospitality rider lagt til',
        description: 'Hospitality rider er klar',
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('band_hospitality')
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
        description: 'Hospitality rider-navn oppdatert',
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: 'Kunne ikke oppdatere hospitality rider',
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const itemToDelete = items.find(item => item.id === itemId);
      if (!itemToDelete) throw new Error('Fil ikke funnet');

      const { error } = await supabase
        .from('band_hospitality')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: t('fileDeleteSuccess'),
        description: 'Hospitality rider slettet',
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: 'Kunne ikke slette hospitality rider',
        variant: "destructive",
      });
    }
  };

  const startEditing = (item: BandHospitalityItem) => {
    setEditingItem(item.id);
    setEditName(item.filename);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditName('');
  };

  return (
    <div className="space-y-3">
      <Button 
        type="button"
        onClick={() => setShowFileModal(true)}
        variant="outline"
      >
        <FolderOpen className="h-4 w-4 mr-2" />
        Velg fra Filbank
      </Button>

      <FileSelectionModal
        open={showFileModal}
        onOpenChange={setShowFileModal}
        files={userFiles}
        allowedTypes={['document', 'pdf', 'hospitality', 'rider', 'application']}
        onFileSelected={handleFileSelected}
        title={t('selectFromFileBank')}
      />

      {loading ? (
        <div className="text-center py-3 text-xs text-muted-foreground">Laster hospitality riders...</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
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
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-accent-pink/20 to-accent-orange/20 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-accent-pink" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.filename}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-pink"></span>
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
          ))}
          {items.length === 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Ingen hospitality-filer ennå
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BandHospitalityManager;
