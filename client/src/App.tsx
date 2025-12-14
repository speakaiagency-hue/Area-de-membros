import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/lib/mockData";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import DashboardHome from "@/pages/dashboard";
import CoursePlayer from "@/pages/course";
import AdminDashboard from "@/pages/admin";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user } = useApp();

  if (!user) return <Redirect to="/auth" />;
  if (adminOnly && user.role !== "admin") return <Redirect to="/" />;

  return <Component />;
}

function Router() {
  const { user } = useApp();

  return (
    <Switch>
      <Route path="/auth">
        {user ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      
      <Route path="/">
        <ProtectedRoute component={DashboardHome} />
      </Route>

      <Route path="/course/:id">
        <ProtectedRoute component={CoursePlayer} />
      </Route>

      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} adminOnly />
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Router />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
