import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Carregando sessão...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
