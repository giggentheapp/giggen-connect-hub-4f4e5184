import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import FeedbackWidget from "./components/FeedbackWidget";

import ConceptView from "./pages/ConceptView";
import UpcomingEvents from "./pages/UpcomingEvents";
import NotFound from "./pages/NotFound";
import GoerMapPage from "./pages/GoerMapPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile/:userId" element={<Profile />} />
        
        <Route path="/concept/:conceptId" element={<ConceptView />} />
        <Route path="/events" element={<UpcomingEvents />} />
        <Route path="/goer-map" element={<GoerMapPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <FeedbackWidget />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
