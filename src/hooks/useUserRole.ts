import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppRole = 'user' | 'organizer' | 'admin';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useUserRoles = () => {
  return useQuery<UserRole[]>({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return (data || []) as unknown as UserRole[];
    },
  });
};

export const useHasRole = (role: AppRole) => {
  const { data: roles } = useUserRoles();
  return roles?.some(r => r.role === role) ?? false;
};

export const useIsAdmin = () => useHasRole('admin');
export const useIsOrganizer = () => useHasRole('organizer');

export const useAddRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role }: { role: AppRole }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_roles" as any)
        .insert({
          user_id: user.id,
          role: role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast.success(`Rolle '${variables.role}' lagt til!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke legge til rolle");
    },
  });
};
