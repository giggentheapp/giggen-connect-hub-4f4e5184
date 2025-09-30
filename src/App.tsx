import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AppLanguageProvider } from "@/contexts/AppLanguageContext";
import { RoleProvider } from "@/contexts/RoleProvider";
import { MobileLayoutOptimizer } from "@/components/MobileLayoutOptimizer";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import { Settings } from "./pages/Settings";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Map from "./pages/Map";
import FeedbackButton from "./components/FeedbackButton";

import ConceptView from "./pages/ConceptView";
import ProfileConceptView from "./pages/ProfileConceptView";
import UpcomingEvents from "./pages/UpcomingEvents";
import NotFound from "./pages/NotFound";
import BookingEdit from "./pages/BookingEdit";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import BookingAgreementPage from "./pages/BookingAgreementPage";
import BookingRequestPage from "./pages/BookingRequestPage";
import BookingAgreementSummary from "./pages/BookingAgreementSummary";
import Bookings from "./pages/Bookings";
import PublicEventView from "./pages/PublicEventView";
import AdminBookingView from "./pages/AdminBookingView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MobileNavigation } from "./components/navigation/MobileNavigation";
import { DesktopSidebar } from "./components/navigation/DesktopSidebar";

const queryClient = new QueryClient();

const App = () => (
  <AppLanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RoleProvider>
          <MobileLayoutOptimizer>
            <ErrorBoundary>
            <Toaster />
            <Sonner />
            <div className="flex min-h-screen w-full">
              {/* Desktop Sidebar - Always visible on desktop */}
              <DesktopSidebar />
              
              {/* Main Content */}
              <main className="flex-1 md:ml-16 pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/start" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/profile/:userId/concept/:conceptId" element={<ProfileConceptView />} />
                  <Route path="/map" element={<Map />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/concept/:conceptId" element={<ConceptView />} />
                  <Route path="/events" element={<UpcomingEvents />} />
                  <Route path="/arrangement/:id" element={<PublicEventView />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/bookings/:id" element={<AdminBookingView />} />
                  <Route path="/booking/create/:makerId" element={<BookingRequestPage />} />
                  <Route path="/booking/:bookingId/edit" element={<BookingEdit />} />
                  <Route path="/booking/:bookingId/summary" element={<BookingAgreementSummary />} />
                  <Route path="/booking/:bookingId/confirm" element={<BookingConfirmationPage />} />
                  <Route path="/booking/:bookingId/agreement" element={<BookingAgreementPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              
              {/* Mobile Navigation - Always visible on mobile */}
              <MobileNavigation />
            </div>
            <FeedbackButton />
          </ErrorBoundary>
        </MobileLayoutOptimizer>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
</AppLanguageProvider>
);

export default App;
