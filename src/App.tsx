// src/App.tsx
// ... (imports remain the same, REMOVE AuthPage import)
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import  Index  from "./pages/Index";
import NotFound from "./pages/NotFound";
// import AuthPage from "./pages/AuthPage"; // REMOVE THIS
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { WelcomePage } from "@/components/WelcomePage"; // IMPORT WELCOME PAGE
import CourseDetailPage from './pages/CourseDetailPage'; // Import the new page
import TeacherCourseDetailPage from './pages/TeacherCourseDetailPage'; // Import the new page

const queryClient = new QueryClient();

// --- Protected Route Component (No changes needed here from previous version) ---
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [user, loading, error] = useAuthState(auth);
  const location = useLocation();

  console.log('ProtectedRoute Check:', { loading, user: user ? user.email : null, error: error ? error.message : null });

  if (loading) {
    console.log('ProtectedRoute: Still loading auth state...');
    return ( <div className="flex justify-center items-center min-h-screen"><Skeleton className="h-12 w-12 rounded-full" /> Loading...</div> );
  }
  if (error) {
      console.error('ProtectedRoute: Auth Error!', error);
      return <div>Authentication Error: {error.message} <a href="/">Try logging in again</a></div>; // Link back to root
  }
  if (!user) {
    console.log('ProtectedRoute: No user found! Redirecting to / (WelcomePage)');
    // Redirect to the root page, which will show WelcomePage if not logged in
    return <Navigate to="/" state={{ from: location }} replace />; // Change target to "/"
  }
  console.log('ProtectedRoute: User found! Rendering children (Index page).');
  return children;
};


const App = () => {
  const [user, loading] = useAuthState(auth); // Check auth state here too

  const handleLoginSuccess = () => {
    // This function is passed to WelcomePage.
    // We don't need to do much here now, as useAuthState will update.
    console.log("Login successful, auth state should update.");
    // Maybe force a reload or navigate, but useAuthState should handle it.
  };

  if (loading) {
       return ( <div className="flex justify-center items-center min-h-screen"><Skeleton className="h-12 w-12 rounded-full" /> Initializing...</div> );
  }

  return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* If user is NOT logged in, show WelcomePage at root. */}
            {/* If user IS logged in, Index page handles showing dashboards. */}
             <Route
                path="/"
                element={
                    user ? <Index /> : <WelcomePage onLoginSuccess={handleLoginSuccess} />
                }
             />

              <Route
                path="/course/:courseId" // Dynamic route with courseId parameter
                element={ user ? <CourseDetailPage /> : <Navigate to="/" replace /> } // Protect this route too
             />
             {/* Removed /auth route */}
             {/* <Route path="/auth" element={<AuthPage />} /> */}

            {/* NotFound route */}

            <Route
                path="/teacher/course/:courseId" // New path for teachers
                element={ user ? <TeacherCourseDetailPage /> : <Navigate to="/" replace /> } // Protect it
             />


            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </QueryClientProvider>
  );
}


export default App;