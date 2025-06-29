import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import About from "@/pages/About";
import GiftCardStore from "@/pages/GiftCardStore";
import Checkout from "@/pages/Checkout";
import PublicGiftCard from "@/pages/PublicGiftCard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import CheckBalance from "@/pages/CheckBalance";
import MerchantLogin from "@/pages/MerchantLogin";
import MerchantRegister from "@/pages/MerchantRegister";
import MerchantDashboard from "@/pages/MerchantDashboard";
import MerchantVerify from "@/pages/MerchantVerify";
import AdminLogin from "@/pages/admin/AdminLogin";
import TestModal from "@/pages/TestModal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/store" component={GiftCardStore} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/check-balance" component={CheckBalance} />
      <Route path="/merchant-login" component={MerchantLogin} />
      <Route path="/merchant-register" component={MerchantRegister} />
      <Route path="/merchant-dashboard" component={MerchantDashboard} />
      <Route path="/merchant-verify" component={MerchantVerify} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/test-modal" component={TestModal} />

      <Route path="/gift/:gan">
        {(params) => <PublicGiftCard gan={params.gan} />}
      </Route>
      <Route path="/admin">
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
