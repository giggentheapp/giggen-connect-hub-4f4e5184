import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

export const SlidingFeedbackPanel = () => {
  const [panelState, setPanelState] = useState<'closed' | 'hovering' | 'expanded'>('closed');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile version - bottom sliding panel
  if (isMobile) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div 
          className={`
            bg-primary text-primary-foreground px-4 py-3 rounded-full cursor-pointer shadow-lg
            transition-all duration-300 hover:scale-105
            ${panelState === 'expanded' ? 'bg-primary/80' : 'bg-primary'}
          `}
          onClick={() => setPanelState(panelState === 'expanded' ? 'closed' : 'expanded')}
        >
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Tilbakemelding</span>
          </div>
        </div>
        
        {panelState === 'expanded' && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setPanelState('closed')}>
            <div 
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-xl animate-slide-in-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Send tilbakemelding</h3>
                  <button 
                    onClick={() => setPanelState('closed')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-muted-foreground">Vi verdsetter din mening om Giggen!</p>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80 transition-colors">
                      🐛 Bug rapport
                    </button>
                    <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80 transition-colors">
                      💡 Forslag
                    </button>
                  </div>
                </div>
                
                <iframe
                  data-tally-open="nr7Bq5" 
                  data-tally-emoji-text="💬" 
                  data-tally-emoji-animation="wave"
                  src="https://tally.so/embed/nr7Bq5?hideTitle=1"
                  width="100%"
                  height="400"
                  frameBorder="0"
                  title="Feedback Form"
                  className="rounded-lg border"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop version - side sliding panel
  return (
    <div 
      className="fixed right-0 top-1/2 transform -translate-y-1/2 z-40"
      onMouseEnter={() => setPanelState(panelState === 'expanded' ? 'expanded' : 'hovering')}
      onMouseLeave={() => setPanelState(panelState === 'expanded' ? 'expanded' : 'closed')}
    >
      {/* Tab/Handle - always visible */}
      <div 
        className={`
          text-primary-foreground px-3 py-6 rounded-l-lg cursor-pointer select-none
          transition-all duration-300 ease-out
          ${panelState === 'closed' ? 'bg-primary shadow-md' : ''}
          ${panelState === 'hovering' ? 'bg-primary/90 shadow-lg transform scale-105' : ''}
          ${panelState === 'expanded' ? 'bg-primary/80 shadow-xl' : ''}
        `}
        onClick={() => setPanelState(panelState === 'expanded' ? 'closed' : 'expanded')}
      >
        <div className="flex flex-col items-center space-y-1">
          <MessageCircle className="w-4 h-4 transition-transform duration-300" />
          <span className="text-xs font-medium transform -rotate-90 whitespace-nowrap">
            Tilbakemelding
          </span>
        </div>
      </div>

      {/* Sliding panel */}
      <div 
        className={`
          absolute right-0 top-0 bg-card border border-border rounded-l-lg shadow-2xl
          transition-all duration-500 ease-out overflow-hidden
          ${panelState === 'closed' ? 'w-0 opacity-0 translate-x-2' : ''}
          ${panelState === 'hovering' ? 'w-80 opacity-95 translate-x-0' : ''}
          ${panelState === 'expanded' ? 'w-80 opacity-100 translate-x-0' : ''}
        `}
        style={{ marginRight: '60px' }}
      >
        <div className="p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Send tilbakemelding</h3>
            <button 
              onClick={() => setPanelState('closed')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3 mb-4">
            <p className="text-sm text-muted-foreground">Vi verdsetter din mening om Giggen!</p>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80 transition-colors">
                🐛 Bug rapport
              </button>
              <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80 transition-colors">
                💡 Forslag
              </button>
            </div>
          </div>
          
          <iframe
            data-tally-open="nr7Bq5" 
            data-tally-emoji-text="💬" 
            data-tally-emoji-animation="wave"
            src="https://tally.so/embed/nr7Bq5?hideTitle=1"
            width="100%"
            height="300"
            frameBorder="0"
            title="Feedback Form"
            className="rounded-lg border"
          />
        </div>
      </div>
    </div>
  );
};