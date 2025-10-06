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
      
      // Prevent zoom on input focus for iOS
      const style = document.createElement('style');
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
          }
          
          input[type="text"], 
          input[type="email"], 
          input[type="password"], 
          input[type="tel"], 
          textarea {
            font-size: 16px !important;
            transform: scale(1) !important;
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.body.classList.remove('mobile-optimized');
        document.head.removeChild(style);
      };
    }
  }, [isMobile]);

  return <>{children}</>;
};