import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Users, 
  Settings, 
  Upload,
  MessageSquare,
  BriefcaseIcon,
  Plus,
  Clock,
  ChevronDown,
  Rocket,
  MapPin,
  Archive
} from "lucide-react";
import { calculateProfileCompletion } from "@/lib/profileCompletion";
import { UserProfile } from "@/types/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserDrafts } from '@/hooks/useUserDrafts';
import { useUserEventDrafts } from '@/hooks/useUserEventDrafts';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { useCompletedEvents } from '@/hooks/useCompletedEvents';
import { DraftEventCard } from '@/components/events/DraftEventCard';
import { DraftOfferCard } from '@/components/concepts/DraftOfferCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  profile: UserProfile;
}

export const DashboardSection = ({ profile }: DashboardSectionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { drafts: offerDrafts, loading: offerDraftsLoading } = useUserDrafts(profile.user_id);
  const { drafts: eventDrafts, loading: eventDraftsLoading } = useUserEventDrafts(profile.user_id);
  const { events: upcomingEventsData, loading: upcomingLoading } = useUpcomingEvents(profile.user_id);
  const { events: completedEventsData, loading: completedLoading } = useCompletedEvents(profile.user_id);

  // Fetch bookings data
  const { data: bookingsData } = useQuery({
    queryKey: ["dashboard-bookings", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .or(`sender_id.eq.${profile.user_id},receiver_id.eq.${profile.user_id}`);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.user_id,
  });

  // Fetch files data
  const { data: filesData } = useQuery({
    queryKey: ["dashboard-files", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;

      const { data, error } = await supabase
        .from("user_files")
        .select("*")
        .eq("user_id", profile.user_id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.user_id,
  });

  // Calculate profile completion
  const { percentage: profileCompletion, missingFields } = calculateProfileCompletion(profile);

  // Calculate stats
  const activeBookings = bookingsData?.filter(
    b => b.status === "upcoming" || b.status === "both_parties_approved"
  ).length || 0;

  const pendingRequests = bookingsData?.filter(
    b => b.status === "pending" && b.receiver_id === profile.user_id
  ).length || 0;

  // Use completed events from combined hook (bookings + events_market)
  const completedJobs = completedEventsData?.length || 0;

  const upcomingEvents = bookingsData?.filter(
    b => b.status === "upcoming" && b.event_date && new Date(b.event_date) > new Date()
  ).sort((a, b) => 
    new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime()
  ).slice(0, 5) || [];

  // Generate "Continue where you left off" suggestions
  const suggestions = [];
  if (profileCompletion < 100) {
    suggestions.push({
      icon: Settings,
      title: "Fullfør profilen",
      description: `${missingFields.length} felt mangler`,
      action: () => {
        const currentPath = location.pathname;
        navigate(`${currentPath}?section=settings`, { 
          state: { missingFields, scrollToMissing: true } 
        });
      },
    });
  }
  if (!filesData || filesData.length === 0) {
    suggestions.push({
      icon: Upload,
      title: "Last opp en fil til Filbank",
      description: "Organiser dine filer",
      action: () => navigate(`${location.pathname}?section=filbank`),
    });
  }
  if (pendingRequests > 0) {
    suggestions.push({
      icon: MessageSquare,
      title: "Svar på forespørsel",
      description: `${pendingRequests} ventende`,
      action: () => navigate(`${location.pathname}?section=bookings`),
    });
  }

  const displaySuggestions = suggestions.slice(0, 3);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary">
              <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile.display_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Hei, {profile.display_name}!</h1>
              <p className="text-sm text-muted-foreground">Velkommen tilbake</p>
            </div>
          </div>
          
          {/* Getting Started Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/getting-started')}
            className="gap-2 shrink-0"
            title="Kom i gang guide"
          >
            <Rocket className="h-4 w-4" />
            Kom i gang
          </Button>
        </div>

        {/* Profile Completion */}
        <Card className="border-border/40 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Fullfør profil
              <span className="text-sm font-normal text-muted-foreground">
                {profileCompletion}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={profileCompletion} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {profileCompletion === 100 
                ? "🎉 Profilen din er fullstendig!" 
                : missingFields.length > 0 
                  ? `Mangler: ${missingFields.join(", ")}`
                  : "Nesten ferdig!"}
            </p>
          </CardContent>
        </Card>

        {/* Continue where you left off - Drafts Section */}
        {(offerDrafts.length > 0 || eventDrafts.length > 0 || displaySuggestions.length > 0) && (
          <div className="space-y-3">
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">
                    Fortsett der du slapp ({offerDrafts.length + eventDrafts.length + displaySuggestions.length})
                  </h2>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="space-y-2 pt-2">
                  {/* Event Drafts - Show first */}
                  {eventDraftsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : (
                    eventDrafts.map(event => (
                      <DraftEventCard
                        key={event.id}
                        event={event}
                        onContinue={() => navigate(`/create-event?draft=${event.id}`)}
                        onDelete={async () => {
                          const { error } = await supabase.from('events_market').delete().eq('id', event.id);
                          if (error) {
                            toast({
                              title: 'Kunne ikke slette utkast',
                              description: error.message,
                              variant: 'destructive',
                            });
                            return;
                          }
                          toast({ title: 'Utkast slettet', description: 'Arrangement-utkastet er permanent fjernet' });
                          queryClient.invalidateQueries({ queryKey: ['user-event-drafts'] });
                        }}
                      />
                    ))
                  )}

                  {/* Offer Drafts */}
                  {offerDraftsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : (
                    offerDrafts.map(draft => (
                      <DraftOfferCard
                        key={draft.id}
                        draft={draft}
                        onContinue={() => navigate(`/create-offer?edit=${draft.id}`)}
                        onDelete={async () => {
                          const { data: files } = await supabase
                            .from('concept_files')
                            .select('id')
                            .eq('concept_id', draft.id);

                          if (files && files.length > 0) {
                            for (const file of files) {
                              await supabase.rpc('delete_concept_file', { file_id: file.id });
                            }
                          }

                          const { error } = await supabase.from('concepts').delete().eq('id', draft.id);
                          if (error) {
                            toast({
                              title: 'Kunne ikke slette utkast',
                              description: error.message,
                              variant: 'destructive',
                            });
                            return;
                          }
                          toast({ title: 'Utkast slettet', description: 'Utkastet og alle filer er permanent fjernet' });
                          queryClient.invalidateQueries({ queryKey: ['user-concepts'] });
                        }}
                        calculateProgress={(d) => {
                          let completed = 0;
                          const total = 6;
                          if (d.title) completed++;
                          if (d.expected_audience && (d.price || d.door_percentage || d.price_by_agreement)) completed++;
                          completed++; // Portfolio
                          completed++; // Tech specs
                          if (d.available_dates) completed++;
                          if (d.is_published) completed++;
                          return { completed, total };
                        }}
                      />
                    ))
                  )}

                  {/* Original suggestions */}
                  {displaySuggestions.map((suggestion, idx) => (
                    <Card
                      key={idx}
                      className="border-border/40 hover:border-primary/50 transition-all cursor-pointer"
                      onClick={suggestion.action}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <suggestion.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Quick Stats */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold px-1 text-muted-foreground">Hurtigstatus</h2>
          <div className="grid grid-cols-2 gap-2">
            <Card 
              className="border-border/40 bg-gradient-to-br from-background to-muted/20 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`${location.pathname}?section=bookings`)}
            >
              <CardContent className="py-3 px-4 flex flex-col items-center gap-1">
                <Calendar className={cn("h-4 w-4 mb-1", activeBookings > 0 ? "text-primary" : "text-[#A1A1AA]")} />
                <div className={cn("text-xl font-bold", activeBookings > 0 ? "text-primary" : "text-[#A1A1AA]")}>
                  {activeBookings}
                </div>
                <p className="text-[10px] text-muted-foreground text-center leading-tight">Aktive bookinger</p>
              </CardContent>
            </Card>

            <Card 
              className="border-border/40 bg-gradient-to-br from-background to-muted/20 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate('/bookings?tab=requests')}
            >
              <CardContent className="py-3 px-4 flex flex-col items-center gap-1">
                <MessageSquare className={cn("h-4 w-4 mb-1", pendingRequests > 0 ? "text-primary" : "text-[#A1A1AA]")} />
                <div className={cn("text-xl font-bold", pendingRequests > 0 ? "text-primary" : "text-[#A1A1AA]")}>
                  {pendingRequests}
                </div>
                <p className="text-[10px] text-muted-foreground text-center leading-tight">Ventende forespørsler</p>
              </CardContent>
            </Card>

            <Card 
              className="border-border/40 bg-gradient-to-br from-background to-muted/20 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`${location.pathname}?section=history`)}
            >
              <CardContent className="py-3 px-4 flex flex-col items-center gap-1">
                <Archive className={cn("h-4 w-4 mb-1", completedJobs > 0 ? "text-primary" : "text-[#A1A1AA]")} />
                <div className={cn("text-xl font-bold", completedJobs > 0 ? "text-primary" : "text-[#A1A1AA]")}>
                  {completedJobs}
                </div>
                <p className="text-[10px] text-muted-foreground text-center leading-tight">Fullførte jobber</p>
              </CardContent>
            </Card>

            <Card 
              className="border-border/40 bg-gradient-to-br from-background to-muted/20 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`${location.pathname}?section=upcoming-events`)}
            >
              <CardContent className="py-3 px-4 flex flex-col items-center gap-1">
                <Clock className={cn("h-4 w-4 mb-1", upcomingEvents.length > 0 ? "text-primary" : "text-[#A1A1AA]")} />
                <div className={cn("text-xl font-bold", upcomingEvents.length > 0 ? "text-primary" : "text-[#A1A1AA]")}>
                  {upcomingEvents.length}
                </div>
                <p className="text-[10px] text-muted-foreground text-center leading-tight">Kommende avtaler</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold px-1 text-muted-foreground">Verktøy</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-1.5 border-border/40 hover:border-primary/50 hover:bg-primary/5 py-3"
              onClick={() => navigate(`${location.pathname}?section=bookings`)}
            >
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Booking</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-1.5 border-border/40 hover:border-primary/50 hover:bg-primary/5 py-3"
              onClick={() => navigate("/create-offer")}
            >
              <BriefcaseIcon className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Mine tilbud</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-1.5 border-border/40 hover:border-primary/50 hover:bg-primary/5 py-3"
              onClick={() => navigate(`${location.pathname}?section=admin-bands`)}
            >
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Mine band</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-1.5 border-border/40 hover:border-primary/50 hover:bg-primary/5 py-3"
              onClick={() => navigate('/create-event')}
            >
              <Plus className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Nytt arrangement</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-1.5 border-border/40 hover:border-primary/50 hover:bg-primary/5 py-3"
              onClick={() => navigate(`${location.pathname}?section=settings`)}
            >
              <Settings className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Innstillinger</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-1.5 border-border/40 hover:border-primary/50 hover:bg-primary/5 py-3"
              onClick={() => navigate(`${location.pathname}?section=filebank`)}
            >
              <Upload className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Filbank</span>
            </Button>
          </div>
        </div>

        {/* Upcoming Events and History */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-16 flex items-center justify-between px-4 border-border/40 hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate(`${location.pathname}?section=upcoming-events`)}
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Kommende arrangementer</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {upcomingEventsData?.length || 0}
            </Badge>
          </Button>

          <Button
            variant="outline"
            className="w-full h-16 flex items-center justify-between px-4 border-border/40 hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate(`${location.pathname}?section=history`)}
          >
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Historikk</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {completedJobs}
            </Badge>
          </Button>
        </div>
      </div>
    </div>
  );
};
