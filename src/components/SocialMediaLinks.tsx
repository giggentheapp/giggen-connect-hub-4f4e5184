interface SocialMediaLinksProps {
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
    tiktok?: string;
    website?: string;
  };
}

export const SocialMediaLinks = ({ socialLinks }: SocialMediaLinksProps) => {
  if (!socialLinks) return null;

  const socialPlatforms = [
    { key: 'instagram', label: 'Instagram', icon: '📷' },
    { key: 'facebook', label: 'Facebook', icon: '📘' },
    { key: 'youtube', label: 'YouTube', icon: '📺' },
    { key: 'spotify', label: 'Spotify', icon: '🎵' },
    { key: 'soundcloud', label: 'SoundCloud', icon: '🔊' },
    { key: 'tiktok', label: 'TikTok', icon: '🎬' },
    { key: 'website', label: 'Website', icon: '🌐' }
  ];

  // Filter out empty links
  const activePlatforms = socialPlatforms.filter(platform => 
    socialLinks[platform.key as keyof typeof socialLinks] && 
    socialLinks[platform.key as keyof typeof socialLinks]?.trim() !== ''
  );

  if (activePlatforms.length === 0) return null;

  return (
    <div className="social-media-links space-y-3">
      <h4 className="text-sm font-medium text-foreground">Følg meg på:</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {activePlatforms.map(platform => (
          <a
            key={platform.key}
            href={socialLinks[platform.key as keyof typeof socialLinks]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-card/50 border border-border rounded-lg text-sm text-foreground hover:bg-card hover:border-primary/50 transition-all duration-200"
          >
            <span className="text-base">{platform.icon}</span>
            <span className="font-medium truncate">{platform.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
};