// src/pages/Index.tsx

import { useState, useEffect } from "react";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import StudentDashboard from "@/components/StudentDashboard"; // Import as default since module exports default
import { AIChatbot } from "@/components/AIChatbot";
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // Import Button if needed for error state

const Index = () => {
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [loadingRole, setLoadingRole] = useState(true); // Start true when auth might be loading
  const navigate = useNavigate();

  // Fetch user role from Firestore when auth state is known
  useEffect(() => {
    console.log('Index useEffect Triggered:', { loadingAuth, user: user ? user.email : null });

    const fetchUserRole = async () => {
      // Only proceed if we have a user object
      if (user) {
        console.log('Index useEffect: User found, fetching role...');
        // Ensure loadingRole is true when starting fetch
        if (!loadingRole) setLoadingRole(true);
        const userRef = doc(db, "users", user.uid);
        try {
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            // Document exists, read the role
            const role = userSnap.data()?.role;
            console.log('Index useEffect: Firestore doc exists, role:', role);
            if (role === 'teacher' || role === 'student') {
              setUserRole(role);
            } else {
              // Role is invalid in existing doc, default AND update Firestore
              console.warn("Index useEffect: User document has invalid role, defaulting to student and updating DB.");
              setUserRole('student');
              // Update Firestore only if necessary
              if (role !== 'student') {
                 await setDoc(userRef, { role: 'student' }, { merge: true });
              }
            }
          } else {
            // Document DOES NOT exist. Check if this is a very new user.
            const metadata = user.metadata;
            const creationTime = metadata.creationTime ? new Date(metadata.creationTime).getTime() : 0;
            const now = new Date().getTime();

            if (now - creationTime < 10000) { // If user created < 10 seconds ago
                console.warn("Index useEffect: User document not found, but user is new (<10s). Race condition likely. Defaulting to student temporarily.");
                setUserRole('student'); // Default temporarily
            } else {
                 // User is not new, but doc is missing. Create it.
                 console.error("Index useEffect: User document not found for established user! Creating with default role 'student'.");
                 await setDoc(userRef, {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName || user.email?.split('@')[0],
                  role: 'student',
                  createdAt: serverTimestamp(),
                });
                 setUserRole('student'); // Set role after creating
            }
          }
        } catch (error) {
            console.error("Index useEffect: Error fetching/creating user role:", error);
            setUserRole('student'); // Default on error
        } finally {
            console.log('Index useEffect: Finished fetching role attempt.');
            setLoadingRole(false); // Mark loading as complete regardless of outcome
        }
      } else if (!loadingAuth) { // Only handle if auth is done loading and still no user
          console.log('Index useEffect: No user object, setting role to null.');
          setUserRole(null);
          setLoadingRole(false); // Ensure loading stops if logged out
      }
    };

    // Trigger fetch only when auth loading is finished
    if (!loadingAuth) {
        console.log('Index useEffect: Auth loading finished, proceeding to fetch role.');
        fetchUserRole();
    } else {
        console.log('Index useEffect: Auth still loading, waiting...');
        // Ensure loadingRole is true while auth loads
        if (!loadingRole) setLoadingRole(true);
    }
  }, [user, loadingAuth]); // Rerun effect if user or loadingAuth changes


  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("Sign out error:", error);
    });
    // App.tsx will handle redirecting to WelcomePage when user becomes null
  };

   // --- LOADING STATE ---
   // Let App.tsx handle the very initial auth loading screen
   // We only show loading here if auth is done, but role is still loading
   if (!loadingAuth && loadingRole && user) {
     console.log("Index Page: Auth loaded, waiting for role...");
     return (
        <div className="flex justify-center items-center min-h-screen">
             <Skeleton className="h-12 w-12 rounded-full animate-pulse" /> <span className="ml-4">Loading user data...</span>
        </div>
     );
   }

   // --- Auth Error State ---
   if (errorAuth) {
       return (
          <div className="text-center mt-10 p-4">
              <p className="text-destructive">Error loading user: {errorAuth.message}.</p>
              <Button onClick={handleLogout} variant="link" className="text-blue-500 underline">Try logging out</Button>
          </div>
       );
   }

   // --- No User State (App.tsx should prevent this, but safeguard) ---
   // If auth has finished loading and there's still no user, App.tsx should render WelcomePage
   if (!loadingAuth && !user) {
       console.log("Index Page: No user found AFTER auth loading! Should be on WelcomePage.");
       return <div>Redirecting to login...</div>; // Fallback message
   }

   // --- Determine Role and Render Dashboard ---
   // We need a user object to proceed here
   if (!user) {
       // This state should ideally not be reached if App.tsx logic is correct
       console.log("Index Page: Still no user object before rendering dashboard?");
       return <div>Initializing...</div>; // Fallback loading
   }

  // Default to student if role is still null AFTER loadingRole is false (e.g., error case)
  const roleToDisplay = userRole || 'student';
  console.log('Index Page: Rendering dashboard for role:', roleToDisplay, `(Actual fetched role: ${userRole}, Role loading: ${loadingRole})`);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-filter backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          {/* Header Left */}
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm">E</div>
            <h1 className="text-xl font-bold text-foreground">EduPlatform</h1>
          </div>
          {/* Header Right */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground capitalize">{user?.displayName || user?.email}</span>
              {/* Show role only if NOT loading role */}
              {!loadingRole && userRole && (<span className="text-xs"> ({userRole})</span>)}
              {loadingRole && (<span className="text-xs"> (Loading role...)</span>)}
            </div>
            <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition-fast">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {/* Render based on determined role */}
        {roleToDisplay === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
      </main>

      <AIChatbot />

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 backdrop-blur">
        <div className="container mx-auto px-6 py-8">
            <div className="text-center text-sm text-muted-foreground">
                <p>© 2025 EduPlatform. Designed for accessible, adaptive learning.</p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;