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
  Archive,
  EyeOff,
  Eye
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
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  // Fetch profile settings to check visibility
  const { data: profileSettings } = useQuery({
    queryKey: ["profile-settings", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;

      const { data, error } = await supabase
        .from("profile_settings")
        .select("*")
        .eq("maker_id", profile.user_id)
        .single();

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
      <div className="max-w-4xl md:max-w-[1280px] mx-auto px-5 md:px-8 py-4 md:py-6 space-y-6 md:space-y-4">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary">
              <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile.display_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-2xl font-bold">Hei, {profile.display_name}!</h1>
              <p className="text-base md:text-sm text-muted-foreground">Velkommen tilbake</p>
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
        <Card className="border-border/40 bg-gradient-to-br from-background to-muted/20 md:shadow-md">
          <CardHeader className="pb-3 md:pb-4 md:px-6 md:pt-6">
            <CardTitle className="text-base md:text-lg flex items-center justify-between">
              Fullfør profil
              <span className="text-sm font-normal text-muted-foreground">
                {profileCompletion}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 md:px-6 md:pb-6">
            <Progress value={profileCompletion} className="h-2 md:h-3" />
            <p className="text-xs md:text-sm text-muted-foreground">
              {profileCompletion === 100 
                ? "🎉 Profilen din er fullstendig!" 
                : missingFields.length > 0 
                  ? `Mangler: ${missingFields.join(", ")}`
                  : "Nesten ferdig!"}
            </p>
          </CardContent>
        </Card>

        {/* Profile Visibility Alert */}
        {profileSettings && !profileSettings.show_public_profile && (
          <Alert className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
            <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                  Profilen din er ikke synlig i Utforsk
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Andre brukere kan ikke finne deg eller se profilen din. Aktiver synlighet for å bli oppdaget.
                </p>
              </div>
              <Button
                size="sm"
                variant="default"
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => {
                  const currentPath = location.pathname;
                  navigate(`${currentPath}?section=settings`, { 
                    state: { scrollToVisibility: true } 
                  });
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Aktiver synlighet
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* "Hva skjer nå?" tom-state seksjon */}
        {(!offerDrafts || offerDrafts.length === 0) && 
         (!eventDrafts || eventDrafts.length === 0) && 
         (!upcomingEventsData || upcomingEventsData.length === 0) && 
         pendingRequests === 0 && 
         activeBookings === 0 && (
          <Card className="border-border/40 bg-gradient-to-br from-background to-muted/20 rounded-2xl md:rounded-lg p-5 md:p-0 bg-white md:bg-transparent shadow-sm md:shadow-none">
            <CardHeader className="p-0 md:p-6">
              <CardTitle className="text-base md:text-lg">Hva skjer nå?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-0 md:p-6 pt-2 md:pt-0">
              <ul className="space-y-2 text-base md:text-base leading-relaxed text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Du har ingen kommende arrangementer.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Opprett et arrangement for å komme i gang.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Lag et tilbud så arrangører kan kontakte deg.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Del profilen din for å bli booket.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

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
          <h2 className="text-sm md:text-xl font-semibold px-1 text-muted-foreground">Hurtigstatus</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-4">
            <Card 
              className="border-border/40 bg-gradient-to-br from-background to-muted/20 cursor-pointer hover:border-primary/50 transition-colors md:shadow-sm rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-sm"
              onClick={() => navigate(`${location.pathname}?section=bookings`)}
            >
              <CardContent className="py-5 md:py-5 px-4 md:px-6 flex flex-col items-center gap-1">
                <Calendar className={cn("h-5 w-5 md:h-5 md:w-5 mb-1", activeBookings > 0 ? "text-orange-500" : "text-[#A1A1AA]")} />
                <div className={cn("text-2xl md:text-[28px] font-bold", activeBookings > 0 ? "text-primary" : "text-[#A1A1AA]")}>
                  {activeBookings}
                </div>
                <p className="text-xs md:text-xs text-muted-foreground text-center leading-tight">Aktive bookinger</p>
              </CardContent>
            </Card>

            <Card 
              className="border-border/40 bg-gradient-to-br from-background to-muted/20 cursor-pointer hover:border-primary/50 transition-colors md:shadow-sm rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-sm"
              onClick={() => navigate('/bookings?tab=requests')}
            >
              <CardContent className="py-5 md:py-5 px-4 md:px-6 flex flex-col items-center gap-1">
                <MessageSquare className={cn("h-5 w-5 md:h-5 md:w-5 mb-1", pendingRequests > 0 ? "text-orange-500" : "text-[#A1A1AA]")} />
                <div className={cn("text-2xl md:text-[28px] font-bold", pendingRequests > 0 ? "text-primary" : "text-[#A1A1AA]")}>
                  {pendingRequests}
                </div>
                <p className="text-xs md:text-xs text-muted-foreground text-center leading-tight">Ventende forespørsler</p>
              </CardContent>
            </Card>

            <Card 
              className="border-border/40 bg-gradient-to-br from-background to-muted/20 cursor-pointer hover:border-primary/50 transition-colors md:shadow-sm rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-sm"
              onClick={() => navigate(`${location.pathname}?section=history`)}
            >
              <CardContent className="py-5 md:py-5 px-4 md:px-6 flex flex-col items-center gap-1">
                <Archive className={cn("h-5 w-5 md:h-5 md:w-5 mb-1", completedJobs > 0 ? "text-orange-500" : "text-[#A1A1AA]")} />
                <div className={cn("text-2xl md:text-[28px] font-bold", completedJobs > 0 ? "text-primary" : "text-[#A1A1AA]")}>
                  {completedJobs}
                </div>
                <p className="text-xs md:text-xs text-muted-foreground text-center leading-tight">Fullførte jobber</p>
              </CardContent>
            </Card>

            <Card 
              className="border-border/40 bg-gradient-to-br from-background to-muted/20 cursor-pointer hover:border-primary/50 transition-colors md:shadow-sm rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-sm"
              onClick={() => navigate(`${location.pathname}?section=upcoming-events`)}
            >
              <CardContent className="py-5 md:py-5 px-4 md:px-6 flex flex-col items-center gap-1">
                <Clock className={cn("h-5 w-5 md:h-5 md:w-5 mb-1", upcomingEvents.length > 0 ? "text-orange-500" : "text-[#A1A1AA]")} />
                <div className={cn("text-2xl md:text-[28px] font-bold", upcomingEvents.length > 0 ? "text-primary" : "text-[#A1A1AA]")}>
                  {upcomingEvents.length}
                </div>
                <p className="text-xs md:text-xs text-muted-foreground text-center leading-tight">Kommende avtaler</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Nytt arrangement CTA */}
        <div className="py-2 md:py-4">
          <button
            onClick={() => navigate('/create-event')}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl md:rounded-lg text-lg md:text-lg font-semibold flex items-center justify-center gap-3 shadow-lg md:shadow-md hover:shadow-xl md:hover:shadow-lg active:scale-[0.98] transition md:transition-all md:h-16"
          >
            <Plus className="h-6 w-6 md:h-6 md:w-6" />
            Opprett nytt arrangement
          </button>
        </div>

        {/* Tools */}
        <div className="space-y-3">
          <h2 className="text-xl md:text-xl font-semibold px-1 text-muted-foreground">Verktøy</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-4">
            <Button
              variant="outline"
              className="h-auto md:h-32 md:min-h-[120px] p-6 md:p-0 flex flex-col items-center justify-center gap-2 md:gap-3 border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-none"
              onClick={() => navigate(`${location.pathname}?section=bookings`)}
            >
              <Calendar className="h-7 w-7 md:h-8 md:w-8 text-orange-500 md:text-primary" />
              <span className="text-base md:text-sm font-medium">Booking</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto md:h-32 md:min-h-[120px] p-6 md:p-0 flex flex-col items-center justify-center gap-2 md:gap-3 border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-none"
              onClick={() => navigate(`${location.pathname}?section=admin-concepts`)}
            >
              <BriefcaseIcon className="h-7 w-7 md:h-8 md:w-8 text-orange-500 md:text-primary" />
              <span className="text-base md:text-sm font-medium">Mine tilbud</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto md:h-32 md:min-h-[120px] p-6 md:p-0 flex flex-col items-center justify-center gap-2 md:gap-3 border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-none"
              onClick={() => navigate(`${location.pathname}?section=admin-bands`)}
            >
              <Users className="h-7 w-7 md:h-8 md:w-8 text-orange-500 md:text-primary" />
              <span className="text-base md:text-sm font-medium">Mine band</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto md:h-32 md:min-h-[120px] p-6 md:p-0 flex flex-col items-center justify-center gap-2 md:gap-3 border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-none"
              onClick={() => navigate('/create-event')}
            >
              <Plus className="h-7 w-7 md:h-8 md:w-8 text-orange-500 md:text-primary" />
              <span className="text-base md:text-sm font-medium">Nytt arrangement</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto md:h-32 md:min-h-[120px] p-6 md:p-0 flex flex-col items-center justify-center gap-2 md:gap-3 border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-none"
              onClick={() => navigate(`${location.pathname}?section=filbank`)}
            >
              <Upload className="h-7 w-7 md:h-8 md:w-8 text-orange-500 md:text-primary" />
              <span className="text-base md:text-sm font-medium">Filbank</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto md:h-32 md:min-h-[120px] p-6 md:p-0 flex flex-col items-center justify-center gap-2 md:gap-3 border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-none"
              onClick={() => navigate(`${location.pathname}?section=settings`)}
            >
              <Settings className="h-7 w-7 md:h-8 md:w-8 text-orange-500 md:text-primary" />
              <span className="text-base md:text-sm font-medium">Innstillinger</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto md:h-32 md:min-h-[120px] p-6 md:p-0 flex flex-col items-center justify-center gap-2 md:gap-3 border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-none"
              onClick={() => navigate(`${location.pathname}?section=upcoming-events`)}
            >
              <div className="flex flex-col items-center gap-2 md:gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-7 w-7 md:h-8 md:w-8 text-orange-500 md:text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    {upcomingEventsData?.length || 0}
                  </Badge>
                </div>
                <span className="text-base md:text-sm font-medium">Kommende</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto md:h-32 md:min-h-[120px] p-6 md:p-0 flex flex-col items-center justify-center gap-2 md:gap-3 border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-2xl md:rounded-lg bg-white md:bg-transparent shadow-sm md:shadow-none"
              onClick={() => navigate(`${location.pathname}?section=history`)}
            >
              <div className="flex flex-col items-center gap-2 md:gap-3">
                <div className="flex items-center gap-2">
                  <Archive className="h-7 w-7 md:h-8 md:w-8 text-orange-500 md:text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    {completedJobs}
                  </Badge>
                </div>
                <span className="text-base md:text-sm font-medium">Historikk</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
