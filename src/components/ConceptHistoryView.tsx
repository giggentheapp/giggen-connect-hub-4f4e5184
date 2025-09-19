import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FileText, ArrowLeft, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConceptHistoryEntry {
  id: string;
  original_concept_id: string;
  maker_id: string;
  title: string;
  description: string | null;
  status: string;
  price: number | null;
  expected_audience: number | null;
  rejected_at: string;
  rejected_by: string;
  rejection_reason: string | null;
  original_created_at: string;
}

interface ConceptHistoryViewProps {
  userId?: string;
  onBack?: () => void;
}

export const ConceptHistoryView = ({ userId, onBack }: ConceptHistoryViewProps) => {
  const [historyEntries, setHistoryEntries] = useState<ConceptHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchHistoryEntries();
    }
  }, [userId]);

  const fetchHistoryEntries = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('concepts_history')
        .select('*')
        .or(`maker_id.eq.${userId},rejected_by.eq.${userId}`)
        .order('rejected_at', { ascending: false });

      if (error) throw error;
      
      setHistoryEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error);
      toast({
        title: "Feil ved lasting av historikk",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('concepts_history')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      setHistoryEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      toast({
        title: "Slettet fra historikk",
        description: "Posten er permanent fjernet fra historikken",
      });
    } catch (error: any) {
      console.error('Error deleting history entry:', error);
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
          )}
          <h1 className="text-2xl font-bold">Tilbudshistorikk</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster historikk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">Tilbudshistorikk</h1>
          <p className="text-muted-foreground">
            Avviste tilbud og deres begrunnelser
          </p>
        </div>
      </div>

      {historyEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen historikk</h3>
            <p className="text-muted-foreground">
              Det finnes ingen avviste tilbud i historikken ennå.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {historyEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{entry.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Avvist: {format(new Date(entry.rejected_at), 'dd.MM.yyyy HH:mm')}</span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {entry.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Slett fra historikk</AlertDialogTitle>
                        <AlertDialogDescription>
                          Er du sikker på at du vil slette denne posten permanent fra historikken? 
                          Dette kan ikke angres.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteHistoryEntry(entry.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Slett permanent
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {entry.description && (
                  <p className="text-muted-foreground">{entry.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {entry.price && (
                    <div>
                      <span className="font-medium">Pris: </span>
                      <span>{entry.price} NOK</span>
                    </div>
                  )}
                  {entry.expected_audience && (
                    <div>
                      <span className="font-medium">Publikum: </span>
                      <span>{entry.expected_audience} personer</span>
                    </div>
                  )}
                </div>

                {entry.rejection_reason && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-2">Begrunnelse for avvisning:</h4>
                    <p className="text-sm text-muted-foreground">{entry.rejection_reason}</p>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Opprinnelig opprettet: {format(new Date(entry.original_created_at), 'dd.MM.yyyy HH:mm')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};