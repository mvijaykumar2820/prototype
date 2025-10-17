// src/pages/Index.tsx
import { useState, useEffect } from "react";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { StudentDashboard } from "@/components/StudentDashboard";
import { AIChatbot } from "@/components/AIChatbot";
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton"; // Make sure Skeleton is imported

const Index = () => {
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const navigate = useNavigate();

  // --- ADDED LOG AT THE TOP ---
  console.log('Index Page Render Start:', { loadingAuth, loadingRole, user: user ? user.email : null, userRole, errorAuth: errorAuth ? errorAuth.message : null });

  useEffect(() => {
    console.log('Index useEffect Triggered:', { loadingAuth, user: user ? user.email : null }); // Log useEffect trigger

    const fetchUserRole = async () => {
      if (user) {
        console.log('Index useEffect: User found, fetching role...');
        setLoadingRole(true);
        const userRef = doc(db, "users", user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const role = userSnap.data()?.role;
             console.log('Index useEffect: Firestore doc exists, role:', role);
            if (role === 'teacher' || role === 'student') {
              setUserRole(role);
            } else {
              console.warn("Index useEffect: User document missing or invalid role, defaulting to student.");
              setUserRole('student');
            }
          } else {
            console.warn("Index useEffect: User document not found, creating with default role 'student'.");
             await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0],
              role: 'student',
              createdAt: new Date(),
            });
             setUserRole('student');
             console.log('Index useEffect: Created Firestore doc for new user.');
          }
        } catch (error) {
            console.error("Index useEffect: Error fetching/creating user role:", error);
            setUserRole('student'); // Default on error
        } finally {
            console.log('Index useEffect: Finished fetching role.');
            setLoadingRole(false);
        }
      } else {
          console.log('Index useEffect: No user object, setting role to null.');
          setUserRole(null);
          setLoadingRole(false);
      }
    };

    if (!loadingAuth) {
        console.log('Index useEffect: Auth loading finished, proceeding to fetch role.');
        fetchUserRole();
    } else {
        console.log('Index useEffect: Auth still loading, waiting...');
    }
  }, [user, loadingAuth]);


  const handleLogout = () => {
    signOut(auth).then(() => {
      console.log("Signed out");
      // navigate('/auth'); // Let ProtectedRoute handle redirect
    }).catch((error) => {
      console.error("Sign out error:", error);
    });
  };

   if (loadingAuth || loadingRole) {
     console.log('Index Page: Render blocked by loading state', { loadingAuth, loadingRole });
     return (
        <div className="flex justify-center items-center min-h-screen">
             <Skeleton className="h-12 w-12 rounded-full" /> Loading user data...
        </div>
     );
   }

   if (errorAuth) {
       console.error('Index Page: Render blocked by Auth Error!', errorAuth);
       return <div>Error loading user: {errorAuth.message}</div>;
   }

   if (!user) {
       console.log("Index Page: Render blocked because no user object AFTER loading checks! Redirecting...");
       // This should ideally be handled by ProtectedRoute, but adding a Navigate here as a safeguard
       // return <Navigate to="/auth" replace />;
       return <div>Not logged in. Redirecting...</div>; // Show message while redirect happens
   }

   // If we reach here, user is loaded, role is loaded (or defaulted), no errors
   console.log('Index Page: Rendering actual dashboard for role:', userRole);

  // --- The rest of your component starts here (the return statement with JSX) ---
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* ... (rest of your Index.tsx JSX) ... */}
       <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-filter backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <h1 className="text-xl font-bold text-foreground">EduPlatform</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground capitalize">{user?.displayName || user?.email}</span> (<span className="text-xs">{userRole || 'Loading role...'}</span>)
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-foreground transition-fast"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)]">
        {userRole === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
      </main>

      <AIChatbot />

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