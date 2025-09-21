import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppLanguageProvider } from "@/contexts/AppLanguageContext";
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
import UpcomingEvents from "./pages/UpcomingEvents";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/start" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Main app routes wrapped with AppLanguageProvider */}
          <Route path="/dashboard" element={
            <AppLanguageProvider>
              <Dashboard />
            </AppLanguageProvider>
          } />
          <Route path="/profile/:userId" element={
            <AppLanguageProvider>
              <Profile />
            </AppLanguageProvider>
          } />
          <Route path="/map" element={
            <AppLanguageProvider>
              <Map />
            </AppLanguageProvider>
          } />
          <Route path="/settings" element={
            <AppLanguageProvider>
              <Settings />
            </AppLanguageProvider>
          } />
          
          {/* Static pages use landing page language system */}
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          
          <Route path="/concept/:conceptId" element={<ConceptView />} />
          <Route path="/events" element={<UpcomingEvents />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FeedbackButton />
      </TooltipProvider>
    </QueryClientProvider>
  </LanguageProvider>
);

export default App;
