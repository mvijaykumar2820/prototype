import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom"; // Add Navigate, useLocation
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage"; // Import AuthPage
import { useAuthState } from 'react-firebase-hooks/auth'; // Import auth hook
import { auth } from '@/lib/firebase'; // Import auth instance
import { Skeleton } from "@/components/ui/skeleton"; // For loading state


const queryClient = new QueryClient();

// --- NEW: Protected Route Component ---
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [user, loading, error] = useAuthState(auth); // Changed variable name for clarity
  const location = useLocation();

  // --- ADDED LOG ---
  console.log('ProtectedRoute Check:', { loading, user: user ? user.email : null, error: error ? error.message : null });
  if (loading) {
    // Show a loading skeleton or spinner while checking auth state
    return (
        <div className="flex justify-center items-center min-h-screen">
             <Skeleton className="h-12 w-12 rounded-full" /> Loading...
        </div>
    );
  }

  if (error) {
      // --- ADDED LOG for errors ---
      console.error('ProtectedRoute: Auth Error!', error);
      return <div>Authentication Error: {error.message} <a href="/auth">Try logging in again</a></div>;
  }

  if (!user) {
    // Redirect them to the /auth page, but save the current location they were
    // trying to go to. This allows us to send them back after login.
    console.log('ProtectedRoute: No user found! Redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: User found! Rendering children.');
  return children; // If logged in, render the child component (Index page)
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
         {/* --- UPDATED ROUTES --- */}
        <Route path="/auth" element={<AuthPage />} /> {/* Login/Signup Page */}
        {/* Protect the main page */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;