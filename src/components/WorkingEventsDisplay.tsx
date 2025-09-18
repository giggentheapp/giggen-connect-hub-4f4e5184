import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, DollarSign, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useBookings } from '@/hooks/useBookings';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  avatar_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  contact_info: any;
}

interface WorkingEventsDisplayProps {
  profile: UserProfile;
  showSensitiveInfo: boolean; // true for own profile, false for others
}

export const WorkingEventsDisplay = ({ profile, showSensitiveInfo }: WorkingEventsDisplayProps) => {
  console.log('DEBUG COMPONENT LOADED');
  console.log('Profile user_id:', profile.user_id);
  console.log('Profile display_name:', profile.display_name);
  console.log('showSensitiveInfo:', showSensitiveInfo);
  
  // COPY THE EXACT WORKING CODE FROM BOOKINGS SECTION
  const { bookings, loading } = useBookings(profile.user_id);
  
  console.log('useBookings returned:', { bookings: bookings?.length || 0, loading });
  console.log('All bookings:', bookings);
  
  // COPY THE EXACT WORKING FILTER
  const upcomingEvents = bookings.filter(b => b.status === 'upcoming');
  
  console.log('Filtered upcoming events:', upcomingEvents.length);
  console.log('Upcoming events data:', upcomingEvents);

  // ALWAYS SHOW HARDCODED TEST - THIS WILL TELL US IF UI STRUCTURE WORKS
  return (
    <div className="space-y-6">
      <div className="bg-red-100 p-4 rounded border-2 border-red-500">
        <h3 className="text-red-800 font-bold">HARDCODED TEST EVENT</h3>
        <p className="text-red-700">If you see this red box, the UI structure works!</p>
        <p className="text-sm text-red-600">
          Profile: {profile.display_name} | 
          User ID: {profile.user_id} | 
          Show Sensitive: {showSensitiveInfo ? 'YES' : 'NO'}
        </p>
        <p className="text-sm text-red-600">
          Real events found: {upcomingEvents.length} | 
          Total bookings: {bookings.length} | 
          Loading: {loading ? 'YES' : 'NO'}
        </p>
      </div>
      
      {upcomingEvents.length > 0 && (
        <div className="bg-green-100 p-4 rounded border-2 border-green-500">
          <h4 className="text-green-800 font-bold">REAL EVENTS FOUND:</h4>
          {upcomingEvents.map(event => (
            <div key={event.id} className="border p-2 mb-2 bg-white rounded">
              <strong>{event.title}</strong> - Status: {event.status}
              <br />
              <small>ID: {event.id}</small>
            </div>
          ))}
        </div>
      )}
      
      {loading && (
        <div className="bg-yellow-100 p-4 rounded border-2 border-yellow-500">
          <p className="text-yellow-800">Loading bookings...</p>
        </div>
      )}
    </div>
  );
};