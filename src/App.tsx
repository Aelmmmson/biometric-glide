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
import StandaloneSetup from "./pages/StandaloneSetup";
import { StepConfigurationPage } from "./components/StepConfigurationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BiometricProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Root Standalone launcher Dashboard */}
            <Route path="/" element={<StandaloneSetup />} />

            {/* Capture phase routes */}
            <Route path="/imaging/:data?" element={<Gateway />} />
            {/* Approval phase route */}
            {/* <Route path="/imaging/approve" element={<Approval />} /> */}
            <Route path="/imaging/image_approval_screen" element={<Approval />} />
            <Route path="/imaging/account_image_approval_screen" element={<Approval mode="account" />} />
            {/* Enquiry phase routes */}
            {/* <Route path="/update/" element={<Update />} /> */}
            <Route path="/imaging/viewimage-:id" element={<Gateway />} />
            <Route path="/imaging/getimagescred-:id" element={<Gateway />} />
            <Route path="/imaging/getimages-:id" element={<Gateway />} />
            <Route path="/imaging/view_cheques-:id" element={<Gateway />} />

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