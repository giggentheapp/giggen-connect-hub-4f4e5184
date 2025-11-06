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
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';

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
    console.log('📎 File selected from filebank:', file);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Auth error:', authError);
        toast({
          title: "Ikke innlogget",
          description: "Du må være innlogget",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ User authenticated, adding file to band portfolio');

      // Generate file_url from file_path if it doesn't exist
      let fileUrl = file.file_url;
      if (!fileUrl && file.file_path) {
        const { data } = supabase.storage.from('filbank').getPublicUrl(file.file_path);
        fileUrl = data.publicUrl;
      }

      // Add to file_usage
      console.log('📝 Adding file usage entry');
      const { error: usageError } = await supabase
        .from('file_usage')
        .insert({
          file_id: file.id,
          usage_type: 'band_portfolio',
          reference_id: bandId
        });

      if (usageError) {
        console.error('❌ Usage error:', usageError);
        throw usageError;
      }

      // Create band portfolio entry
      console.log('📝 Creating band portfolio entry');
      const portfolioData = {
        band_id: bandId,
        file_type: file.file_type,
        filename: file.filename,
        file_path: file.file_path,
        file_url: fileUrl,
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

      if (error) {
        console.error('❌ Portfolio insert error:', error);
        throw error;
      }

      console.log('✅ File added to band portfolio');
      setItems(prev => [data, ...prev]);
      setShowFileModal(false);
      toast({
        title: 'Fil lagt til',
        description: 'Filen er lagt til i bandporteføljen'
      });
    } catch (error: any) {
      console.error('❌ Error in handleFileSelected:', error);
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
        onClick={() => {
          console.log('🔘 Opening filebank modal', { userId, bandId });
          setShowFileModal(true);
        }}
        variant="outline"
        className="w-full h-10 text-sm"
      >
        <Cloud className="h-4 w-4 mr-2" />
        {t('selectFromFileBank')}
      </Button>

      <FilebankSelectionModal
        isOpen={showFileModal}
        onClose={() => {
          console.log('🔘 Closing filebank modal');
          setShowFileModal(false);
        }}
        onSelect={handleFileSelected}
        userId={userId}
        fileTypes={['image', 'video']}
        title={t('selectFromFileBank')}
        description="Velg bilder eller videoer fra filbanken"
      />

      {loading ? (
        <div className="text-center py-3 text-xs text-muted-foreground">Laster portefølje...</div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
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
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-xs">{t('description')}</Label>
                    <Textarea 
                      id="description" 
                      value={editDescription} 
                      onChange={e => setEditDescription(e.target.value)}
                      className="text-sm min-h-[80px]"
                    />
                  </div>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <Button size="sm" onClick={() => handleUpdateItem(item.id)} className="h-9 text-sm flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {t('save')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing} className="h-9 text-sm flex-1">
                      <X className="h-4 w-4 mr-2" />
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-accent-orange/20 to-accent-pink/20 flex items-center justify-center">
                    {item.file_type === 'image' && <ImageIcon className="h-5 w-5 text-accent-orange" />}
                    {item.file_type === 'video' && <VideoIcon className="h-5 w-5 text-accent-pink" />}
                    {item.file_type === 'audio' && <MusicIcon className="h-5 w-5 text-accent-purple" />}
                    {item.file_type === 'document' && <FileText className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.title || item.filename}</h4>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-orange"></span>
                      <span className="capitalize">{item.file_type}</span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleDateString('no-NO')}</span>
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => startEditing(item)} className="h-8 w-8 sm:h-7 sm:w-7 p-0">
                      <Edit2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)} className="h-8 w-8 sm:h-7 sm:w-7 p-0 hover:bg-destructive/10 hover:text-destructive">
                      <X className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
              <p>Ingen porteføljefiler ennå</p>
              <p className="text-xs mt-1">Klikk på knappen over for å legge til filer</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BandPortfolioManager;
