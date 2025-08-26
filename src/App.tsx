import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MapView from "./pages/MapView";
import ConceptView from "./pages/ConceptView";
import UpcomingEvents from "./pages/UpcomingEvents";
import EventMarket from "./pages/EventMarket";
import GoerDashboard from "./pages/goer/GoerDashboard";
import GoerMarket from "./pages/goer/GoerMarket";
import GoerMap from "./pages/goer/GoerMap";
import GoerMakers from "./pages/goer/GoerMakers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/goer/market" element={<GoerDashboard><GoerMarket /></GoerDashboard>} />
          <Route path="/dashboard/goer/map" element={<GoerDashboard><GoerMap /></GoerDashboard>} />
          <Route path="/dashboard/goer/makers" element={<GoerDashboard><GoerMakers /></GoerDashboard>} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/concept/:conceptId" element={<ConceptView />} />
          <Route path="/events" element={<UpcomingEvents />} />
          <Route path="/market" element={<EventMarket />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
