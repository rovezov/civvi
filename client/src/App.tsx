import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import UserDashboard from "@/pages/user/dashboard";
import UserSearch from "@/pages/user/search";
import UserProfile from "@/pages/user/profile";
import OrganizerEvents from "@/pages/organizer/events";
import OrganizerProfile from "@/pages/organizer/profile";

function Router() {
  return (
    <Switch>
      {/* Auth page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Regular user routes */}
      <ProtectedRoute path="/" component={UserDashboard} requiredRole="regular" />
      <ProtectedRoute path="/search" component={UserSearch} requiredRole="regular" />
      <ProtectedRoute path="/profile" component={UserProfile} requiredRole="regular" />
      
      {/* Community organizer routes */}
      <ProtectedRoute path="/organizer" component={OrganizerEvents} requiredRole="organizer" />
      <ProtectedRoute path="/organizer/profile" component={OrganizerProfile} requiredRole="organizer" />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
