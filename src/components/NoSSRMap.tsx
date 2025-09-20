import React, { useState, useEffect, ReactNode } from 'react';

interface NoSSRMapProps {
  children: ReactNode;
}

// Wrapper som sikrer kun client-side rendering
const NoSSRMap = ({ children }: NoSSRMapProps) => {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return (
      <div className="w-full h-96 bg-muted flex items-center justify-center rounded-lg">
        <p className="text-muted-foreground">Forbereder kart...</p>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default NoSSRMap;