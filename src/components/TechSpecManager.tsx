import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit2, Save, X } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

interface TechSpecItem {
  id: string;
  profile_id: string;
  filename: string;
  file_url: string;
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
        title: "Feil",
        description: "Kunne ikke laste tech specs",
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
      title: "Tech spec lastet opp",
      description: "Tech spec filen er klar til bruk i konsepter",
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
        title: "Oppdatert",
        description: "Tech spec navnet er oppdatert",
      });
    } catch (error: any) {
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere tech spec",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('profile_tech_specs')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: "Slettet",
        description: "Tech spec er slettet",
      });
    } catch (error: any) {
      toast({
        title: "Feil",
        description: "Kunne ikke slette tech spec",
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUpload
          bucketName="portfolio"
          folderPath={`techspec/${userId}`}
          onFileUploaded={handleFileUploaded}
          acceptedTypes=".pdf,.doc,.docx,.txt,.md"
          targetTable="profile_tech_specs"
        />

        {loading ? (
          <div className="text-center py-4">Laster tech specs...</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                {editingItem === item.id ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Navn</Label>
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
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
                      <h4 className="font-medium">{item.filename}</h4>
                      <p className="text-xs text-muted-foreground mt-2">
                        Type: {item.file_type} • {new Date(item.created_at).toLocaleDateString('no-NO')}
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
                Ingen tech spec filer ennå. Last opp dokumenter som beskriver tekniske krav.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TechSpecManager;