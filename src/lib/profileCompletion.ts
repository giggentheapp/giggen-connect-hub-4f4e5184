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
  ];

  const completedCount = checks.filter(c => c.complete).length;
  const percentage = Math.round((completedCount / checks.length) * 100);
  const missingFields = checks.filter(c => !c.complete).map(c => c.field);

  return { percentage, missingFields };
}
