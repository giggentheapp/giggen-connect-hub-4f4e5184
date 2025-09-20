import React from 'react';
import { MapPin } from 'lucide-react';

interface SimpleMapPlaceholderProps {
  makers?: any[];
  className?: string;
}

const SimpleMapPlaceholder: React.FC<SimpleMapPlaceholderProps> = ({ 
  makers = [], 
  className = "w-full h-96" 
}) => {
  return (
    <div className={`${className} bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-200 rounded-lg`}>
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-3">
            <MapPin className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Interaktivt kart kommer snart
          </h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Vi jobber med å implementere kartfunksjonalitet for bedre oversikt
          </p>
        </div>
        
        {makers.length > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              {makers.length} musikere i nettverket
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleMapPlaceholder;