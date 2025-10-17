import React, { useEffect } from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { EmailAuthProvider } from 'firebase/auth'; // Import specific providers
import { auth, db } from '@/lib/firebase'; // Import your auth instance
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth'; // Helpful hook
import { doc, setDoc, getDoc } from "firebase/firestore";

const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    EmailAuthProvider.PROVIDER_ID, // Enable Email/Password auth
    // Add other providers like Google, etc., if you enabled them in Firebase
  ],
  callbacks: {
    signInSuccessWithAuthResult: (authResult: any, redirectUrl?: string) => {
      // Create user document in Firestore on first sign-in
      const user = authResult.user;
      if (user && authResult.additionalUserInfo?.isNewUser) {
        const userRef = doc(db, "users", user.uid);
        setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0], // Use email part if no name
          role: 'student', // Default role - needs UI to change later
          createdAt: new Date(),
        }).catch(error => {
            console.error("Error creating user document:", error);
        });
      }
      return false; // Prevent redirect, we'll handle it with useNavigate
    },
  },
};

const AuthPage = () => {
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Check Firestore if user has a role, redirect accordingly
      const checkUserRole = async () => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          // Redirect based on role or to dashboard if role exists
           navigate('/'); // Redirect to main Index page for now
        } else {
            // User exists in Auth but not Firestore (edge case), create doc?
            console.warn("User exists in Auth but not Firestore. Creating doc.");
             setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0],
              role: 'student', // Default role
              createdAt: new Date(),
            }).then(() => navigate('/'))
              .catch(error => console.error("Error creating user document:", error));
        }
      };
      checkUserRole();
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>; // Simple loading state
  }
   if (error) {
    return <div>Error: {error.message}</div>; // Show auth errors
  }

  // If user is already logged in, useEffect will navigate away
  // If not logged in, show the FirebaseUI login form
  if (!user) {
      return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h1>Welcome to EduPlatform</h1>
          <p>Please sign in or sign up to continue</p>
          <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
        </div>
      );
  }

  // Fallback while redirecting
  return <div>Redirecting...</div>;
};

export default AuthPage;