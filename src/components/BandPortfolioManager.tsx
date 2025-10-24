import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Edit2, Save, FileText, Image as ImageIcon, Video as VideoIcon, Music as MusicIcon, Cloud } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useUserFiles } from '@/hooks/useUserFiles';
import { FileSelectionModal } from '@/components/FileSelectionModal';

interface BandPortfolioItem {
  id: string;
  band_id: string;
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

interface BandPortfolioManagerProps {
  userId: string;
  bandId: string;
  title: string;
  description: string;
}

const BandPortfolioManager = ({
  userId,
  bandId,
  title,
  description
}: BandPortfolioManagerProps) => {
  const [items, setItems] = useState<BandPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
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
        .from('band_portfolio')
        .select('*')
        .eq('band_id', bandId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching band portfolio:', error);
      toast({
        title: t('error'),
        description: 'Kunne ikke laste bandportefølje',
        variant: "destructive"
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
          description: "Du må være innlogget",
          variant: "destructive"
        });
        return;
      }

      // Add to file_usage
      const { error: usageError } = await supabase
        .from('file_usage')
        .insert({
          file_id: file.id,
          usage_type: 'band_portfolio',
          reference_id: bandId
        });

      if (usageError) throw usageError;

      // Create band portfolio entry
      const portfolioData = {
        band_id: bandId,
        file_type: file.file_type,
        filename: file.filename,
        file_path: file.file_path,
        file_url: file.file_url,
        file_size: file.file_size,
        mime_type: file.mime_type,
        title: file.filename,
        description: '',
        is_public: true
      };

      const { data, error } = await supabase
        .from('band_portfolio')
        .insert(portfolioData)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      toast({
        title: 'Fil lagt til',
        description: 'Filen er lagt til i bandporteføljen'
      });
    } catch (error: any) {
      toast({
        title: 'Feil',
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('band_portfolio')
        .update({
          filename: editTitle || undefined,
          title: editTitle || undefined,
          description: editDescription || undefined
        })
        .eq('id', itemId);

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
        description: 'Porteføljeelement oppdatert'
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: 'Kunne ikke oppdatere element',
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const itemToDelete = items.find(item => item.id === itemId);
      if (!itemToDelete) throw new Error('Fil ikke funnet');

      // Delete from database
      const { error } = await supabase
        .from('band_portfolio')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: t('fileDeleteSuccess'),
        description: 'Porteføljeelement slettet'
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: 'Kunne ikke slette element',
        variant: "destructive"
      });
    }
  };

  const startEditing = (item: BandPortfolioItem) => {
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
      
      <Button 
        onClick={() => setShowFileModal(true)}
        variant="outline"
        className="w-full h-9 text-xs"
      >
        <Cloud className="h-4 w-4 mr-2" />
        {t('selectFromFileBank')}
      </Button>

      <FileSelectionModal
        open={showFileModal}
        onOpenChange={setShowFileModal}
        files={userFiles}
        allowedTypes={['image', 'video']}
        onFileSelected={handleFileSelected}
        title={t('selectFromFileBank')}
      />

      {loading ? (
        <div className="text-center py-3 text-xs text-muted-foreground">Laster portefølje...</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="group relative rounded-lg border border-border/40 bg-gradient-to-br from-background to-muted/20 p-3 hover:border-border transition-all">
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
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-accent-orange/20 to-accent-pink/20 flex items-center justify-center">
                    {item.file_type === 'image' && <ImageIcon className="h-4 w-4 text-accent-orange" />}
                    {item.file_type === 'video' && <VideoIcon className="h-4 w-4 text-accent-pink" />}
                    {item.file_type === 'audio' && <MusicIcon className="h-4 w-4 text-accent-purple" />}
                    {item.file_type === 'document' && <FileText className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.title || item.filename}</h4>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-orange"></span>
                      {item.file_type} • {new Date(item.created_at).toLocaleDateString('no-NO')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => startEditing(item)} className="h-7 w-7 p-0">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)} className="h-7 w-7 p-0 hover:bg-muted">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Ingen porteføljefiler ennå
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BandPortfolioManager;
