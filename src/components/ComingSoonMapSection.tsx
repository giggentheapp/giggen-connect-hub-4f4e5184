import React from 'react';
import { MapPin } from 'lucide-react';

const ComingSoonMapSection = () => {
  return (
    <div className="w-full h-96 bg-gradient-to-br from-muted via-accent to-muted/50 rounded-lg border border-border">
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Interaktivt kart kommer snart
        </h3>
        
        <div className="max-w-md space-y-3 text-sm text-muted-foreground">
          <p className="flex items-center justify-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
            Geografisk oversikt over musikere i Norge
          </p>
          <p className="flex items-center justify-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
            Avstandsbasert søk og filtrering
          </p>
          <p className="flex items-center justify-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
            Visuell oversikt over lokal musikkscene
          </p>
          <p className="flex items-center justify-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
            Enkel identifisering av musikere i ditt område
          </p>
        </div>
        
        <div className="mt-6 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
          Under utvikling
        </div>
      </div>
    </div>
  );
};

export default ComingSoonMapSection;