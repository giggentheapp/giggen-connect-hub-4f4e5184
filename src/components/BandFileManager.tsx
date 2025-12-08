import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Edit2, Save, FileText, Image as ImageIcon, Video as VideoIcon, Music as MusicIcon, FolderOpen } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';

type FileManagerType = 'portfolio' | 'tech_spec' | 'hospitality';

interface BandFileManagerProps {
  userId: string;
  bandId: string;
  title: string;
  description: string;
  type: FileManagerType;
}

interface FileItem {
  id: string;
  band_id: string;
  filename: string;
  file_url?: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  mime_type?: string;
  title?: string;
  description?: string;
  is_public?: boolean;
  created_at: string;
  updated_at?: string;
}

const CONFIG: Record<FileManagerType, {
  table: 'band_portfolio' | 'band_tech_specs' | 'band_hospitality';
  usageType: string;
  fileTypes: string[];
  hasPublicFlag: boolean;
  iconGradient: string;
  iconColor: string;
  dotColor: string;
  layout: 'grid' | 'stack';
  iconSize: string;
  buttonIconSize: string;
}> = {
  portfolio: {
    table: 'band_portfolio',
    usageType: 'band_portfolio',
    fileTypes: ['image', 'video'],
    hasPublicFlag: true,
    iconGradient: 'from-accent-orange/20 to-accent-pink/20',
    iconColor: 'text-accent-orange',
    dotColor: 'bg-accent-orange',
    layout: 'grid',
    iconSize: 'w-12 h-12',
    buttonIconSize: 'h-5 w-5'
  },
  tech_spec: {
    table: 'band_tech_specs',
    usageType: 'band_tech_spec',
    fileTypes: ['document'],
    hasPublicFlag: false,
    iconGradient: 'from-accent-purple/20 to-accent-pink/20',
    iconColor: 'text-accent-purple',
    dotColor: 'bg-accent-purple',
    layout: 'stack',
    iconSize: 'w-10 h-10',
    buttonIconSize: 'h-4 w-4'
  },
  hospitality: {
    table: 'band_hospitality',
    usageType: 'band_hospitality',
    fileTypes: ['document'],
    hasPublicFlag: false,
    iconGradient: 'from-accent-pink/20 to-accent-orange/20',
    iconColor: 'text-accent-pink',
    dotColor: 'bg-accent-pink',
    layout: 'stack',
    iconSize: 'w-10 h-10',
    buttonIconSize: 'h-4 w-4'
  }
};

const MESSAGES: Record<FileManagerType, {
  addSuccess: { title: string; description: string };
  updateSuccess: string;
  deleteSuccess: string;
  loadError: string;
  updateError: string;
  deleteError: string;
  loadingText: string;
  emptyText: string | string[];
  modalDescription: string;
}> = {
  portfolio: {
    addSuccess: { title: 'Fil lagt til', description: 'Filen er lagt til i bandporteføljen' },
    updateSuccess: 'Porteføljeelement oppdatert',
    deleteSuccess: 'Porteføljeelement slettet',
    loadError: 'Kunne ikke laste bandportefølje',
    updateError: 'Kunne ikke oppdatere element',
    deleteError: 'Kunne ikke slette element',
    loadingText: 'Laster portefølje...',
    emptyText: ['Ingen porteføljefiler ennå', 'Klikk på knappen over for å legge til filer'],
    modalDescription: 'Velg bilder eller videoer fra filbanken'
  },
  tech_spec: {
    addSuccess: { title: 'Tech spec lagt til', description: 'Teknisk spesifikasjon er klar' },
    updateSuccess: 'Tech spec-navn oppdatert',
    deleteSuccess: 'Tech spec slettet',
    loadError: 'Kunne ikke laste tekniske spesifikasjoner',
    updateError: 'Kunne ikke oppdatere tech spec',
    deleteError: 'Kunne ikke slette tech spec',
    loadingText: 'Laster tech specs...',
    emptyText: 'Ingen tech spec-filer ennå',
    modalDescription: 'Velg en tech spec fil fra din filbank'
  },
  hospitality: {
    addSuccess: { title: 'Hospitality rider lagt til', description: 'Hospitality rider er klar' },
    updateSuccess: 'Hospitality rider-navn oppdatert',
    deleteSuccess: 'Hospitality rider slettet',
    loadError: 'Kunne ikke laste hospitality riders',
    updateError: 'Kunne ikke oppdatere hospitality rider',
    deleteError: 'Kunne ikke slette hospitality rider',
    loadingText: 'Laster hospitality riders...',
    emptyText: 'Ingen hospitality-filer ennå',
    modalDescription: 'Velg en hospitality rider fil fra din filbank'
  }
};

const BandFileManager = ({
  userId,
  bandId,
  title,
  description,
  type
}: BandFileManagerProps) => {
  const config = CONFIG[type];
  const messages = MESSAGES[type];
  
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editName, setEditName] = useState('');
  const [showFileModal, setShowFileModal] = useState(false);
  const { toast } = useToast();
  const { t } = useAppTranslation();

  useEffect(() => {
    fetchItems();
  }, [bandId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from(config.table)
        .select('*')
        .eq('band_id', bandId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error(`Error fetching ${type}:`, error);
      toast({
        title: t('error'),
        description: messages.loadError,
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
          description: type === 'portfolio' ? "Du må være innlogget" : undefined,
          variant: "destructive"
        });
        return;
      }

      // Generate file_url from file_path if missing
      let fileUrl = file.file_url;
      if (!fileUrl && file.file_path) {
        const { data } = supabase.storage.from('filbank').getPublicUrl(file.file_path);
        fileUrl = data.publicUrl;
      }

      // Add to file_usage
      const { error: usageError } = await supabase
        .from('file_usage')
        .insert({
          file_id: file.id,
          usage_type: config.usageType,
          reference_id: bandId
        });

      if (usageError) throw usageError;

      // Create entry based on type
      let insertData: any;
      if (type === 'portfolio') {
        insertData = {
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
      } else {
        insertData = {
          band_id: bandId,
          filename: file.filename,
          file_path: file.file_path,
          file_url: fileUrl,
          file_type: file.file_type,
          file_size: file.file_size,
          mime_type: file.mime_type
        };
      }

      const { data, error } = await supabase
        .from(config.table)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      toast(messages.addSuccess);
    } catch (error: any) {
      console.error(`Error in handleFileSelected (${type}):`, error);
      toast({
        title: type === 'portfolio' ? 'Feil' : t('error'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    try {
      let updateData: any;
      
      if (type === 'portfolio') {
        updateData = {
          filename: editTitle || undefined,
          title: editTitle || undefined,
          description: editDescription || undefined
        };
      } else {
        updateData = { filename: editName };
      }

      const { error } = await supabase
        .from(config.table)
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.map(item => {
        if (item.id !== itemId) return item;
        
        if (type === 'portfolio') {
          return {
            ...item,
            filename: editTitle || item.filename,
            title: editTitle || item.title,
            description: editDescription
          };
        } else {
          return { ...item, filename: editName };
        }
      }));

      setEditingItem(null);
      setEditTitle('');
      setEditDescription('');
      setEditName('');

      toast({
        title: t('fileUpdateSuccess'),
        description: messages.updateSuccess
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: messages.updateError,
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const itemToDelete = items.find(item => item.id === itemId);
      if (!itemToDelete) throw new Error('Fil ikke funnet');

      const { error } = await supabase
        .from(config.table)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: t('fileDeleteSuccess'),
        description: messages.deleteSuccess
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: messages.deleteError,
        variant: "destructive"
      });
    }
  };

  const startEditing = (item: FileItem) => {
    setEditingItem(item.id);
    if (type === 'portfolio') {
      setEditTitle(item.title || item.filename);
      setEditDescription(item.description || '');
    } else {
      setEditName(item.filename);
    }
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditTitle('');
    setEditDescription('');
    setEditName('');
  };

  const getFileIcon = (fileType: string) => {
    if (type === 'portfolio') {
      if (fileType === 'image') return <ImageIcon className="h-5 w-5 text-accent-orange" />;
      if (fileType === 'video') return <VideoIcon className="h-5 w-5 text-accent-pink" />;
      if (fileType === 'audio') return <MusicIcon className="h-5 w-5 text-accent-purple" />;
      return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
    return <FileText className={`h-4 w-4 ${config.iconColor}`} />;
  };

  const renderEditForm = (item: FileItem) => {
    if (type === 'portfolio') {
      return (
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
      );
    }

    return (
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
    );
  };

  const renderDisplayMode = (item: FileItem) => {
    const isPortfolio = type === 'portfolio';
    
    return (
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${config.iconSize} rounded-lg bg-gradient-to-br ${config.iconGradient} flex items-center justify-center`}>
          {getFileIcon(item.file_type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">
            {isPortfolio ? (item.title || item.filename) : item.filename}
          </h4>
          {isPortfolio && item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          <p className={`${isPortfolio ? 'text-xs mt-1.5' : 'text-[10px] mt-1'} text-muted-foreground flex items-center gap-2`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dotColor}`}></span>
            <span className="capitalize">{item.file_type}</span>
            <span>•</span>
            <span>{new Date(item.created_at).toLocaleDateString('no-NO')}</span>
          </p>
        </div>
        <div className={`flex ${isPortfolio ? 'flex-col sm:flex-row gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100' : 'gap-1 shrink-0 opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => startEditing(item)} 
            className={`${isPortfolio ? 'h-8 w-8 sm:h-7 sm:w-7' : 'h-7 w-7'} p-0`}
          >
            <Edit2 className={`${isPortfolio ? 'h-3.5 w-3.5 sm:h-3 sm:w-3' : 'h-3 w-3'}`} />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleDeleteItem(item.id)} 
            className={`${isPortfolio ? 'h-8 w-8 sm:h-7 sm:w-7' : 'h-7 w-7'} p-0 ${isPortfolio ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:bg-muted'}`}
          >
            <X className={`${isPortfolio ? 'h-3.5 w-3.5 sm:h-3 sm:w-3' : 'h-3 w-3'}`} />
          </Button>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    const isPortfolio = type === 'portfolio';
    const emptyText = messages.emptyText;
    
    if (isPortfolio && Array.isArray(emptyText)) {
      return (
        <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          <p>{emptyText[0]}</p>
          <p className="text-xs mt-1">{emptyText[1]}</p>
        </div>
      );
    }
    
    return (
      <div className="text-center py-4 text-xs text-muted-foreground">
        {emptyText as string}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header - only for portfolio */}
      {type === 'portfolio' && (
        <div>
          <h3 className="text-sm font-medium mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground mb-3">{description}</p>
        </div>
      )}
      
      {/* Button */}
      <Button 
        type="button"
        onClick={(e) => {
          if (type === 'portfolio') {
            e.preventDefault();
            e.stopPropagation();
          }
          setShowFileModal(true);
        }}
        variant="outline"
        className={type === 'portfolio' ? "w-full h-10 text-sm" : ""}
      >
        <FolderOpen className="h-4 w-4 mr-2" />
        Velg fra Filbank
      </Button>
      
      {/* FilebankSelectionModal */}
      {showFileModal && (
        <FilebankSelectionModal
          isOpen={showFileModal}
          onClose={() => setShowFileModal(false)}
          onSelect={handleFileSelected}
          userId={userId}
          fileTypes={config.fileTypes}
          title={type === 'portfolio' ? "Velg fra Filbank" : t('selectFromFileBank')}
          description={messages.modalDescription}
        />
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-3 text-xs text-muted-foreground">
          {messages.loadingText}
        </div>
      ) : (
        <div className={config.layout === 'grid' ? "grid grid-cols-1 gap-2" : "space-y-2"}>
          {items.map(item => (
            <div 
              key={item.id} 
              className="group relative rounded-lg border border-border/40 bg-gradient-to-br from-background to-muted/20 p-3 hover:border-border transition-all"
            >
              {editingItem === item.id ? renderEditForm(item) : renderDisplayMode(item)}
            </div>
          ))}
          {items.length === 0 && renderEmptyState()}
        </div>
      )}
    </div>
  );
};

export default BandFileManager;
