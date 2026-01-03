import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardRedirect from "@/components/redirects/DashboardRedirect";
import BookingsRedirect from "@/components/redirects/BookingsRedirect";
import { queryClient } from "@/lib/queryClient";
import { AppLanguageProvider } from "@/contexts/AppLanguageContext";
import { RoleProvider } from "@/contexts/RoleProvider";
import { MobileLayoutOptimizer } from "@/components/MobileLayoutOptimizer";
import Root from "./pages/Root";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Map from "./pages/Map";
import FeedbackButton from "./components/FeedbackButton";

import ConceptOwnerView from "./pages/ConceptOwnerView";
import ProfileConceptView from "./pages/ProfileConceptView";
import CreateOffer from "./pages/CreateOffer";
import BookingRequestPage from "./pages/BookingRequestPage";
import BookingAgreementReview from "./pages/BookingAgreementReview";
import UniversalAgreementView from "./components/UniversalAgreementView";
import PublicEventView from "./pages/PublicEventView";
import CheckIn from "./pages/CheckIn";
import TicketSuccess from "./pages/TicketSuccess";
import TicketView from "./pages/TicketView";
import BandProfile from "./pages/BandProfile";
import CreateEvent from "./pages/CreateEvent";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { useInitializeAdmin } from "./hooks/useInitializeAdmin";

import SecurityDashboard from "./pages/SecurityDashboard";

// Simple inline 404 component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
      <p className="text-xl text-muted-foreground mb-4">Siden ble ikke funnet</p>
      <a href="/" className="text-primary hover:text-primary/80 underline">
        Tilbake til forsiden
      </a>
    </div>
  </div>
);

const App = () => {
  useInitializeAdmin();
  
  return (
    <AppLanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RoleProvider>
          <MobileLayoutOptimizer>
            <ErrorBoundary>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Root />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/getting-started" element={<Onboarding mode="menu" />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/profile/:userId/concept/:conceptId" element={<ProfileConceptView />} />
              <Route path="/map" element={<Map />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/concept/:conceptId" element={<ConceptOwnerView />} />
              <Route path="/create-offer" element={<CreateOffer />} />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/arrangement/:id" element={<PublicEventView />} />
              <Route path="/bookings" element={<BookingsRedirect />} />
              
              <Route path="/booking/create/:makerId" element={<BookingRequestPage />} />
              <Route path="/booking/:bookingId/review" element={<BookingAgreementReview />} />
              <Route path="/booking/:bookingId/view" element={<UniversalAgreementView />} />
              
              {/* Ticket System Routes */}
              <Route path="/check-in" element={<CheckIn />} />
              <Route path="/ticket-success" element={<TicketSuccess />} />
              <Route path="/billett/:ticketId" element={<TicketView />} />
              
              {/* Band Routes */}
              <Route path="/band/:bandId" element={<BandProfile />} />
              
              {/* File Bank Route - Redirect to auth (will handle dashboard redirect when logged in) */}
              <Route path="/filbank" element={<Navigate to="/auth" replace />} />
              
              {/* Security Dashboard - Development Only */}
              {import.meta.env.DEV && (
                <Route path="/admin/security" element={<SecurityDashboard />} />
              )}
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FeedbackButton />
          </ErrorBoundary>
        </MobileLayoutOptimizer>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
</AppLanguageProvider>
  );
};

export default App;
