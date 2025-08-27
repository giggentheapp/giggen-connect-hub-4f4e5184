import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MakerDashboard from "./pages/maker/MakerDashboard";
import GoerDashboard from "./pages/goer/GoerDashboard";
import BookingsPage from "./pages/bookings/BookingsPage";
import EventMarketPage from "./pages/events/EventMarketPage";
import NotFoundPage from "./pages/NotFoundPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Routes>
          {/* Default → redirect til maker */}
          <Route path="/" element={<Navigate to="/maker" replace />} />

          {/* Maker */}
          <Route path="/maker/*" element={<MakerDashboard />} />

          {/* Goer */}
          <Route path="/goer/*" element={<GoerDashboard />} />

          {/* Bookings */}
          <Route path="/bookings" element={<BookingsPage />} />

          {/* Event Market */}
          <Route path="/events-market" element={<EventMarketPage />} />

          {/* Catch all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
