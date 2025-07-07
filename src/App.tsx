
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BookingPage from "./pages/BookingPage";
import UsersPage from "./pages/UsersPage";
import TeachersPage from "./pages/TeachersPage";
import HallsPage from "./pages/HallsPage";
import StagesPage from "./pages/StagesPage";
import BookingsPage from "./pages/BookingsPage";
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
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/halls" element={<HallsPage />} />
          <Route path="/stages" element={<StagesPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
