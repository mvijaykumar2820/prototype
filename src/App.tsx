// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Ensure necessary router components are imported
import { Routes, Route, Navigate, useLocation, HashRouter } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// Ensure WelcomePage is correctly imported if used directly here
import { WelcomePage } from "@/components/WelcomePage";
import CourseDetailPage from './pages/CourseDetailPage';
import TeacherCourseDetailPage from './pages/TeacherCourseDetailPage';
import LessonPage from './pages/LessonPage'; // Import LessonPage
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";

const queryClient = new QueryClient();

// App component
const App = () => {
  const [user, loading] = useAuthState(auth); // Checks login state

  // Callback for WelcomePage after successful sign-in
  const handleLoginSuccess = () => {
    // useAuthState hook will automatically update the 'user' variable,
    // triggering a re-render. No manual navigation needed here usually.
    console.log("Login successful, auth state should update and trigger re-render.");
  };

  // Show loading indicator while Firebase Auth initializes
  if (loading) {
       return (
           <div className="flex justify-center items-center min-h-screen">
               <Skeleton className="h-12 w-12 rounded-full animate-pulse" /> <span className="ml-4">Initializing...</span>
           </div>
       );
  }

  // Main application structure with routing
  return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* HashRouter should ideally be in main.tsx, but ensure it wraps Routes */}
          {/* If HashRouter is in main.tsx, remove it from here */}
          {/* <HashRouter> Remove if in main.tsx */}
          <Routes>
             {/* Root Path: Show Index if logged in, WelcomePage otherwise */}
             <Route
                path="/"
                element={ user ? <Index /> : <WelcomePage onLoginSuccess={handleLoginSuccess} /> }
             />

             {/* Student Course Detail Page */}
             {/* Protect route: Redirect to root (WelcomePage) if not logged in */}
             <Route
                path="/course/:courseId"
                element={ user ? <CourseDetailPage /> : <Navigate to="/" replace /> }
             />

             {/* --- LESSON PAGE ROUTE --- */}
             {/* Ensure this path matches EXACTLY what the Link generates */}
             {/* Path should be relative within the HashRouter context */}
             <Route
                path="/course/:courseId/lesson/:lessonId"
                element={ user ? <LessonPage /> : <Navigate to="/" replace /> } // Protect route
             />

             {/* Teacher Course Detail Page */}
             <Route
                path="/teacher/course/:courseId"
                element={ user ? <TeacherCourseDetailPage /> : <Navigate to="/" replace /> } // Protect route
             />

             {/* Catch-all for unknown routes */}
             <Route path="*" element={<NotFound />} />
          </Routes>
          {/* </HashRouter> Remove if in main.tsx */}
        </TooltipProvider>
      </QueryClientProvider>
  );
}
export default App;