import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import About from "@/pages/About";
import GiftCardStore from "@/pages/GiftCardStore";
import GiftCardSuccess from "@/pages/GiftCardSuccess";
import Checkout from "@/pages/Checkout";
import PublicGiftCard from "@/pages/PublicGiftCard";
import PublicStorefront from "@/pages/PublicStorefront";
import PublicGiftCardStore from "@/pages/PublicGiftCardStore";
import EmotionalGiftCardStore from "@/pages/EmotionalGiftCardStore";
import GiftCardPurchase from "@/pages/GiftCardPurchase";
import PurchaseSuccess from "@/pages/PurchaseSuccess";
import PhysicalGiftCardStore from "@/pages/PhysicalGiftCardStore";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminGiftCardOrders from "@/pages/AdminGiftCardOrders";
import AdminMerchantSettings from "@/pages/AdminMerchantSettings";
import AdminGiftCardAnalytics from "@/pages/AdminGiftCardAnalytics";
import AdminThreatReplay from "@/pages/AdminThreatReplay";
import CheckBalance from "@/pages/CheckBalance";
import MerchantLogin from "@/pages/MerchantLogin";
import MerchantRegister from "@/pages/MerchantRegister";
import MerchantDashboard from "@/pages/MerchantDashboard";
import MerchantBulkPurchase from "@/pages/MerchantBulkPurchase";
import MerchantGiftCardAnalytics from "@/pages/MerchantGiftCardAnalytics";
import MerchantAnalyticsPanel from "@/pages/MerchantAnalyticsPanel";
import MerchantQRScanner from "@/pages/MerchantQRScanner";
import MerchantVerify from "@/pages/MerchantVerify";
import MerchantSettingsPage from "@/pages/MerchantSettingsPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import TestModal from "@/pages/TestModal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/store" component={GiftCardStore} />
      <Route path="/giftcard-store" component={GiftCardStore} />
      <Route path="/giftcard-store/success/:orderId" component={GiftCardSuccess} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/checkout/:merchantId" component={Checkout} />
      <Route path="/check-balance" component={CheckBalance} />
      <Route path="/gift-cards" component={PublicGiftCardStore} />
      <Route path="/physical-cards" component={PhysicalGiftCardStore} />
      <Route path="/physical-giftcard-store" component={PhysicalGiftCardStore} />
      <Route path="/emotional-gifts" component={EmotionalGiftCardStore} />
      <Route path="/gift-cards/purchase/:merchantId?" component={GiftCardPurchase} />
      <Route path="/gift-cards/success/:orderId" component={PurchaseSuccess} />
      <Route path="/gift-success/:orderId" component={GiftCardSuccess} />
      <Route path="/merchant-login" component={MerchantLogin} />
      <Route path="/merchant-register" component={MerchantRegister} />
      <Route path="/merchant-dashboard">
        <ProtectedRoute role="merchant">
          <MerchantDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/merchant-bulk-purchase">
        <ProtectedRoute role="merchant">
          <MerchantBulkPurchase />
        </ProtectedRoute>
      </Route>
      <Route path="/merchant-qr-scanner">
        <ProtectedRoute role="merchant">
          <MerchantQRScanner />
        </ProtectedRoute>
      </Route>
      <Route path="/merchant/analytics">
        <ProtectedRoute role="merchant">
          <MerchantAnalyticsPanel />
        </ProtectedRoute>
      </Route>
      <Route path="/merchant-settings">
        <ProtectedRoute role="merchant">
          <MerchantSettingsPage />
        </ProtectedRoute>
      </Route>
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
      <Route path="/admin/giftcard-orders">
        <ProtectedRoute role="admin">
          <AdminGiftCardOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/merchant-settings">
        <ProtectedRoute role="admin">
          <AdminMerchantSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute role="admin">
          <AdminGiftCardAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/merchant-analytics">
        <ProtectedRoute role="merchant">
          <MerchantGiftCardAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/merchant-qr">
        <ProtectedRoute role="merchant">
          <MerchantQRScanner />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/threat-replay">
        <ProtectedRoute role="admin">
          <AdminThreatReplay />
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
