import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, User } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  fallback?: ReactNode;
  showLoginPrompt?: boolean;
}

/**
 * Protected route component that requires user authentication
 */
export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  fallback, 
  showLoginPrompt = true 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, error } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state if authentication failed
  if (error && requireAuth) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Authentication Error</CardTitle>
            <CardDescription>
              Unable to verify your authentication status. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login prompt if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (showLoginPrompt) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Login Required</CardTitle>
              <CardDescription>
                Please login to access the interview platform and track your progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <p>✅ Track your interview progress</p>
                <p>✅ Save your evaluation results</p>
                <p>✅ Access personalized recommendations</p>
                <p>✅ View your performance history</p>
              </div>
              <Button 
                onClick={() => window.location.href = '/api/login'} 
                className="w-full"
                size="lg"
              >
                Login to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      // Redirect to login without showing prompt
      window.location.href = '/api/login';
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }
  }

  // User is authenticated or authentication is not required, render children
  return <>{children}</>;
}

/**
 * Hook to easily protect components within a page
 */
export function useProtectedPage(requireAuth = true) {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  return {
    user,
    isLoading,
    isAuthenticated,
    canAccess: !requireAuth || isAuthenticated,
    shouldShowLogin: requireAuth && !isAuthenticated && !isLoading
  };
}