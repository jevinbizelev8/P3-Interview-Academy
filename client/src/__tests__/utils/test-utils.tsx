import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock user for testing
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user' as const,
};

// Create a test-specific query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllProvidersProps {
  children: React.ReactNode;
  initialPath?: string;
}

function AllProviders({ children, initialPath = '/' }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  // Mock router with initial path
  React.useEffect(() => {
    if (initialPath !== '/') {
      window.history.pushState({}, '', initialPath);
    }
  }, [initialPath]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          {children}
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialPath?: string;
}

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialPath, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialPath={initialPath}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
};

export * from '@testing-library/react';
export { customRender as render };
export { mockUser };