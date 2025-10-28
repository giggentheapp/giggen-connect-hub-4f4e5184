interface SocialMediaLinksProps {
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
    tiktok?: string;
    website?: string;
    twitter?: string;
    appleMusic?: string;
    bandcamp?: string;
  };
}

export const SocialMediaLinks = ({ socialLinks }: SocialMediaLinksProps) => {
  if (!socialLinks) return null;

  const socialPlatforms = [
    { 
      key: 'instagram', 
      label: 'Instagram',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: '#E4405F'
    },
    { 
      key: 'facebook', 
      label: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: '#1877F2'
    },
    { 
      key: 'youtube', 
      label: 'YouTube',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      color: '#FF0000'
    },
    { 
      key: 'spotify', 
      label: 'Spotify',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      ),
      color: '#1DB954'
    },
    { 
      key: 'soundcloud', 
      label: 'SoundCloud',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path d="M3 13h2l1 4-1 4H3l-1-4 1-4zm3-2h2l1 6-1 6H6l-1-6 1-6zm3-2h2l1 8-1 8H9l-1-8 1-8zm3 0h2l1 8-1 8h-2l-1-8 1-8zm3 2h8a3 3 0 0 1 0 6h-8l-1-6 1-6z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
        </svg>
      ),
      color: '#FF5500'
    },
    { 
      key: 'tiktok', 
      label: 'TikTok',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path d="M9 12a4 4 0 1 0 4 4V6a5 5 0 0 0 5 5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
        </svg>
      ),
      color: '#000000'
    },
    { 
      key: 'website', 
      label: 'Website',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
        </svg>
      ),
      color: '#6366F1'
    },
    { 
      key: 'twitter', 
      label: 'Twitter/X',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path d="M4 4l11.733 16h4.267l-11.733-16z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
          <path d="M4 20L20 4" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
        </svg>
      ),
      color: '#000000'
    },
    { 
      key: 'appleMusic', 
      label: 'Apple Music',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="currentColor" d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.188-.58C19.568.18 18.75.025 17.945 0c-1.463-.01-2.927.011-4.39.026-.619.007-1.239 0-1.858.024-.544.021-1.088.045-1.631.091-.578.05-1.153.114-1.722.21-1.04.175-2.01.596-2.867 1.276-.686.543-1.166 1.242-1.463 2.081C3.752 4.37 3.61 5.058 3.563 5.754c-.054.79-.066 1.582-.074 2.374 0 .388 0 .776-.002 1.164l-.002 4.58c-.003 1.076.001 2.153.015 3.23.011.806.035 1.612.109 2.416.105 1.15.476 2.19 1.174 3.098.633.826 1.46 1.377 2.455 1.681.742.227 1.51.334 2.285.379.727.042 1.456.044 2.185.045 1.395.002 2.79 0 4.185 0h4.18c.72 0 1.443.002 2.163-.026.783-.03 1.563-.096 2.33-.277 1.245-.293 2.23-.936 2.983-1.962.609-.829.94-1.77 1.047-2.807.086-.833.105-1.669.11-2.506.007-1.164.003-2.329.003-3.493l.002-2.614c0-.608.001-1.216-.002-1.823zm-2.512 11.17c-.016.816-.05 1.633-.138 2.444-.098.905-.42 1.701-1.036 2.359-.596.637-1.322 1.041-2.19 1.205-.578.109-1.164.15-1.753.167a39.01 39.01 0 0 1-2.084.015l-3.883-.002c-.758-.001-1.516-.004-2.274-.01a27.847 27.847 0 0 1-1.963-.076c-.728-.068-1.442-.192-2.126-.457-.948-.368-1.665-1.006-2.134-1.895-.344-.652-.526-1.349-.586-2.082-.056-.686-.067-1.374-.074-2.062-.01-1.012-.004-2.024-.004-3.037 0-1.545.002-3.09.003-4.636.001-.77.008-1.54.034-2.308.038-1.097.252-2.153.854-3.116.495-.79 1.182-1.36 2.051-1.68.715-.264 1.463-.38 2.225-.416.704-.034 1.41-.048 2.116-.053 1.448-.01 2.897-.004 4.345-.004 1.446 0 2.893-.005 4.339.005.69.005 1.381.022 2.07.06.917.051 1.815.201 2.67.569 1.001.432 1.728 1.142 2.196 2.169.356.783.498 1.615.553 2.465.054.838.066 1.678.072 2.518.01 1.55.004 3.1.002 4.65-.001 1.143-.003 2.286-.014 3.428z"/>
        </svg>
      ),
      color: '#FA243C'
    },
    { 
      key: 'bandcamp', 
      label: 'Bandcamp',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path d="M6 18L14 6h4l-8 12H6z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
        </svg>
      ),
      color: '#1DA0C3'
    }
  ];

  // Filter out empty links
  const activePlatforms = socialPlatforms.filter(platform => 
    socialLinks[platform.key as keyof typeof socialLinks] && 
    socialLinks[platform.key as keyof typeof socialLinks]?.trim() !== ''
  );

  if (activePlatforms.length === 0) return null;

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    // Ensure URL has protocol
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="social-media-links space-y-3">
      <div className="flex flex-wrap gap-3">
        {activePlatforms.map(platform => (
          <button
            key={platform.key}
            onClick={(e) => handleLinkClick(socialLinks[platform.key as keyof typeof socialLinks]!, e)}
            className="w-11 h-11 rounded-full border-2 transition-all duration-200 flex items-center justify-center hover:scale-105 hover:shadow-lg"
            style={{ 
              borderColor: platform.color,
              color: platform.color
            }}
            title={platform.label}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = platform.color;
              e.currentTarget.style.color = platform.key === 'tiktok' ? '#ffffff' : '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = platform.color;
            }}
          >
            {platform.icon}
          </button>
        ))}
      </div>
    </div>
  );
};