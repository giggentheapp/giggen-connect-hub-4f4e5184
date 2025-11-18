import { UserProfile } from "@/types/auth";

export interface ProfileCompletionResult {
  percentage: number;
  missingFields: string[];
}

export function calculateProfileCompletion(
  profile: UserProfile | null
): ProfileCompletionResult {
  if (!profile) {
    return { percentage: 0, missingFields: [] };
  }

  const checks = [
    {
      field: "Profilbilde",
      complete: !!profile.avatar_url,
    },
    {
      field: "Visningsnavn",
      complete: !!profile.display_name && profile.display_name.length > 0,
    },
    {
      field: "Brukernavn",
      complete: !!profile.username && profile.username.length > 0,
    },
    {
      field: "Bio",
      complete: !!profile.bio && profile.bio.length > 0,
    },
    {
      field: "Kontaktinformasjon",
      complete: !!profile.contact_info && 
        (profile.contact_info.email || profile.contact_info.phone),
    },
    {
      field: "Sosiale medier",
      complete: !!profile.social_media_links && 
        Object.values(profile.social_media_links).some(v => v && v.length > 0),
    },
    {
      field: "Musikkplattform",
      complete: !!profile.social_media_links &&
        (profile.social_media_links.spotify || 
         profile.social_media_links.youtube || 
         profile.social_media_links.soundcloud),
    },
    {
      field: "Offentlige innstillinger",
      complete: profile.is_address_public === true,
    },
  ];

  const completedCount = checks.filter(c => c.complete).length;
  const percentage = Math.round((completedCount / checks.length) * 100);
  const missingFields = checks.filter(c => !c.complete).map(c => c.field);

  return { percentage, missingFields };
}
