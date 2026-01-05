import { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileLayoutOptimizerProps {
  children: React.ReactNode;
}

export const MobileLayoutOptimizer = ({ children }: MobileLayoutOptimizerProps) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      // Add mobile-specific viewport meta tag
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.getElementsByTagName('head')[0].appendChild(viewport);
      }
      // Allow browser address bar to show/hide on scroll for Instagram-like behavior
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content');

      // Add mobile-specific classes to body
      document.body.classList.add('mobile-optimized');
      document.documentElement.classList.add('mobile-optimized');
      
      // Add theme-color meta for status bar
      let themeColor = document.querySelector('meta[name="theme-color"]');
      if (!themeColor) {
        themeColor = document.createElement('meta');
        themeColor.setAttribute('name', 'theme-color');
        document.getElementsByTagName('head')[0].appendChild(themeColor);
      }
      themeColor.setAttribute('content', '#ffffff');
      themeColor.setAttribute('media', '(prefers-color-scheme: light)');
      
      // Dark mode theme color
      let themeColorDark = document.querySelector('meta[name="theme-color"][media*="dark"]');
      if (!themeColorDark) {
        themeColorDark = document.createElement('meta');
        themeColorDark.setAttribute('name', 'theme-color');
        themeColorDark.setAttribute('media', '(prefers-color-scheme: dark)');
        document.getElementsByTagName('head')[0].appendChild(themeColorDark);
      }
      themeColorDark.setAttribute('content', '#171717');
      
      // Prevent zoom on input focus for iOS
      const style = document.createElement('style');
      style.id = 'mobile-optimizer-styles';
      style.innerHTML = `
        @media screen and (max-width: 768px) {
          /* Use dynamic viewport height to adapt to address bar */
          html, body {
            height: 100dvh;
            overflow: hidden;
          }
          
          #root {
            height: 100dvh;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-y: contain;
          }
          
          /* Prevent zoom on input focus */
          input[type="text"], 
          input[type="email"], 
          input[type="password"], 
          input[type="tel"],
          input[type="number"],
          input[type="search"],
          input[type="url"],
          textarea,
          select {
            font-size: 16px !important;
            transform: scale(1) !important;
          }
          
          /* Ensure proper safe area handling */
          .safe-area-top {
            padding-top: env(safe-area-inset-top);
          }
          
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          /* Smooth scrolling */
          * {
            scroll-behavior: smooth;
          }
          
          /* Better touch scrolling */
          .scroll-container {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.body.classList.remove('mobile-optimized');
        document.documentElement.classList.remove('mobile-optimized');
        const existingStyle = document.getElementById('mobile-optimizer-styles');
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
      };
    }
  }, [isMobile]);

  return <>{children}</>;
};