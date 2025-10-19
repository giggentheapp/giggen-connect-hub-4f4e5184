import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useInitializeAdmin() {
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Sjekk om brukeren allerede har admin-rolle
        const { data: existingRole } = await supabase
          .from('user_roles' as any)
          .select('id')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        // Hvis ikke, legg til admin-rolle automatisk
        if (!existingRole) {
          await supabase
            .from('user_roles' as any)
            .insert({
              user_id: user.id,
              role: 'admin'
            })
            .select()
            .single();

          console.log('Admin rolle automatisk lagt til for bruker:', user.email);
        }
      } catch (error) {
        console.error('Feil ved initialisering av admin:', error);
      }
    };

    initializeAdmin();
  }, []);
}
