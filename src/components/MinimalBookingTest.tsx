import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MinimalBookingTestProps {
  profile: {
    user_id: string;
    display_name: string;
  };
}

export const MinimalBookingTest = ({ profile }: MinimalBookingTestProps) => {
  console.log('🧪 MinimalBookingTest rendering for:', profile.user_id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Booking Test - Safe Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <p>User: {profile.display_name} ({profile.user_id})</p>
          <p className="text-green-600">✅ Booking section loaded safely</p>
          <p className="text-sm text-muted-foreground">
            This is a minimal test to verify the booking section works without crashes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};