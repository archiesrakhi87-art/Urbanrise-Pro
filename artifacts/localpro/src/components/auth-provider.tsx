import React, { createContext, useContext, useEffect } from 'react';
import { useGetMe } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { type AuthSession, getGetMeQueryKey } from '@workspace/api-client-react';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: AuthSession | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  });

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAuth({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    } else if (!isLoading && isAuthenticated && role && user?.role !== role) {
      // Redirect to correct shell if wrong role
      if (user?.role === 'resident') setLocation('/');
      else if (user?.role === 'provider') setLocation('/provider/dashboard');
      else if (user?.role === 'admin') setLocation('/admin/metrics');
    }
  }, [isLoading, isAuthenticated, setLocation, role, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (role && user?.role !== role)) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
