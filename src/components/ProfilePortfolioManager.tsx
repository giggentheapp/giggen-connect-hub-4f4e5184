import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit2, Save, X } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

interface ProfilePortfolioItem {
  id: string;
  user_id: string;
  file_url?: string;
  title?: string;
  description?: string;
  created_at: string;
}

interface ProfilePortfolioManagerProps {
  userId: string;
  title: string;
  description: string;
}

const ProfilePortfolioManager = ({ userId, title, description }: ProfilePortfolioManagerProps) => {
  const [items, setItems] = useState<ProfilePortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [userId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_portfolio')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching portfolio items:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste portefølje",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = async (fileData: any) => {
    try {
      const { data, error } = await supabase
        .from('profile_portfolio')
        .insert({
          user_id: userId,
          title: fileData.filename
        })
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      toast({
        title: "Fil lastet opp",
        description: "Filen er lagt til i porteføljen din",
      });
    } catch (error: any) {
      toast({
        title: "Feil ved opplasting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('profile_portfolio')
        .update({
          title: editTitle || undefined,
          description: editDescription || undefined
        })
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, title: editTitle || item.title, description: editDescription }
          : item
      ));

      setEditingItem(null);
      setEditTitle('');
      setEditDescription('');

      toast({
        title: "Oppdatert",
        description: "Portfolio elementet er oppdatert",
      });
    } catch (error: any) {
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere elementet",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('profile_portfolio')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: "Slettet",
        description: "Portfolio elementet er slettet",
      });
    } catch (error: any) {
      toast({
        title: "Feil",
        description: "Kunne ikke slette elementet",
        variant: "destructive",
      });
    }
  };

  const startEditing = (item: ProfilePortfolioItem) => {
    setEditingItem(item.id);
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditTitle('');
    setEditDescription('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUpload
          bucketName="portfolio"
          folderPath={userId}
          onFileUploaded={handleFileUploaded}
          acceptedTypes=".jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav,.pdf,.doc,.docx"
        />

        {loading ? (
          <div className="text-center py-4">Laster portefølje...</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                {editingItem === item.id ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="title">Tittel</Label>
                      <Input
                        id="title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Beskrivelse</Label>
                      <Textarea
                        id="description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateItem(item.id)}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Lagre
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title || 'Untitled'}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(item.created_at).toLocaleDateString('no-NO')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(item)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Ingen filer i porteføljen ennå
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfilePortfolioManager;