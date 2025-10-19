import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useInitializeAdmin() {
  useEffect(() => {
    const checkAndAddAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Sjekk om e-posten er på whitelist
        const { data: whitelistEntry } = await supabase
          .from('admin_whitelist' as any)
          .select('email')
          .eq('email', user.email)
          .single();

        if (!whitelistEntry) {
          // E-posten er ikke på whitelist, ikke gjør til admin
          return;
        }

        // E-posten er på whitelist, sjekk om brukeren allerede har admin-rolle
        const { data: existingRole } = await supabase
          .from('user_roles' as any)
          .select('id')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        // Hvis ikke, legg til admin-rolle
        if (!existingRole) {
          await supabase
            .from('user_roles' as any)
            .insert({
              user_id: user.id,
              role: 'admin'
            })
            .select()
            .single();

          console.log('Admin rolle lagt til for:', user.email);
        }
      } catch (error) {
        console.error('Feil ved admin-initialisering:', error);
      }
    };

    checkAndAddAdminRole();
  }, []);
}
