import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BiometricProvider } from "@/contexts/BiometricContext";
import Index from "./pages/Index";
import Approval from "./pages/Approval";
import Update from "./pages/Update";
import Enquiry from "./pages/Enquiry";
import NotFound from "./pages/NotFound";
import Gateway from "./pages/Gateway";
import { StepConfigurationPage } from "./components/StepConfigurationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BiometricProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Capture phase routes */}
            <Route path="/imaging/:data?" element={<Gateway />} />
            {/* Approval phase route */}
            {/* <Route path="/imaging/approve" element={<Approval />} /> */}
            <Route path="/imaging/image_approval_screen" element={<Approval />} />
            {/* Update phase route */}
            {/* <Route path="/update/" element={<Update />} /> */}
            {/* Enquiry phase route */}
            {/* <Route path="/viewimage-:customerId" element={<Enquiry />} /> */}
            {/* Default route */}
            {/* <Route path="/" element={<Index />} /> */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/imaging/stepconfig" element={<StepConfigurationPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BiometricProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;


// STOP