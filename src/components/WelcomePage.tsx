// src/components/WelcomePage.tsx

import { useState } from "react";
// Removed CheckCircle as we won't show the success card
import { GraduationCap, Users, Sparkles, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut // Keep signOut import
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

interface WelcomePageProps {
  onLoginSuccess: () => void; // Signals successful SIGN IN
}

export const WelcomePage = ({ onLoginSuccess }: WelcomePageProps) => {
  const [loginMode, setLoginMode] = useState<"select" | "teacher" | "student">("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  // --- REMOVED showSignupSuccess state ---
  // const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  const features = [
    { icon: GraduationCap, title: "Adaptive Content", description: "Smart streaming..." },
    { icon: Users, title: "AI-Powered Learning", description: "Intelligent notes..." },
    { icon: Sparkles, title: "Collaborative Platform", description: "Connect teachers..." }
  ];

  const handleAuthAction = async () => {
    if (!email || !password || loginMode === 'select') {
      setError("Please enter email and password.");
      return;
    }
    setIsLoading(true);
    setError(null);
    // setShowSignupSuccess(false); // No longer needed

    const selectedRole = loginMode;

    try {
      if (isSignUp) {
        // --- Sign Up Logic ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User signed up:", user.uid);
        await updateProfile(user, { displayName: email.split('@')[0] });
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          role: selectedRole,
          createdAt: serverTimestamp(),
        });
        console.log("Firestore document created for new user with role:", selectedRole);

        // --- CHANGE HERE: Sign out, show alert, reset form ---
        await signOut(auth); // Log the user out immediately
        console.log("Signed out immediately after signup.");
        alert("Account created successfully! Please log in now."); // Show browser alert
        setEmail(""); // Clear email field
        setPassword(""); // Clear password field
        setIsSignUp(false); // Switch back to the Sign In view

      } else {
        // --- Sign In Logic (Stays the Same) ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User signed in:", userCredential.user.uid);
        // ... (Role verification code remains the same) ...
        const userRef = doc(db, "users", userCredential.user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
             const firestoreRole = docSnap.data()?.role;
             if (firestoreRole !== selectedRole) {
                 setError(`You are registered as a ${firestoreRole}. Please log in using the ${firestoreRole} option.`);
                 setIsLoading(false); return;
             }
        } else {
             setError("User profile not found. Please contact support.");
             setIsLoading(false); return;
        }
        onLoginSuccess(); // Signal success ONLY on Sign In
      }
    } catch (authError: any) {
        console.error("Authentication error:", authError);
        let message = "An error occurred. Please try again.";
         if (authError.code === 'auth/email-already-in-use') { message = "This email is already registered. Try signing in."; }
         else if (authError.code === 'auth/invalid-email') { message = "Please enter a valid email address."; }
         else if (authError.code === 'auth/weak-password') { message = "Password should be at least 6 characters."; }
         else if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') { message = "Incorrect email or password."; }
        setError(message);
    } finally {
      setIsLoading(false); // Set loading false after action completes or fails
    }
  };

  // --- Reset function for going back ---
  const resetToRoleSelection = () => {
    setLoginMode("select");
    setEmail("");
    setPassword("");
    setError(null);
    setIsSignUp(false);
    // setShowSignupSuccess(false); // No longer needed
  };

  // --- Render Login/Signup Form ---
  if (loginMode === "teacher" || loginMode === "student") {
    // --- REMOVED CONDITIONAL RENDERING FOR SUCCESS CARD ---
    return (
      <div className="min-h-screen flex items-center justify-center p-6 hero-gradient">
        <Card className="w-full max-w-md card-elevated shadow-medium bg-background">
            {/* The form is now always rendered here */}
            <>
              <CardHeader className="text-center space-y-4">
                 <div className="mx-auto w-16 h-16 rounded-full gradient-glass flex items-center justify-center bg-white/10 border border-border/50">
                  {loginMode === "teacher" ? <Users className="h-8 w-8 text-primary" /> : <GraduationCap className="h-8 w-8 text-primary" />}
                 </div>
                 <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {/* Title now correctly reflects Sign In after signup */}
                    {isSignUp ? "Sign Up" : "Login"} as {loginMode === "teacher" ? "Teacher" : "Student"}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {/* Description now correctly reflects Sign In after signup */}
                    {isSignUp ? "Create an account to get started" : "Welcome back! Please sign in"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" >Email</Label>
                        <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="bg-background focus:border-primary"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="bg-background focus:border-primary"/>
                    </div>
                </div>

                {error && <p className="text-sm text-center text-destructive">{error}</p>}

                <div className="space-y-3">
                  <Button onClick={handleAuthAction} disabled={isLoading} className="w-full transition-smooth" size="lg">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSignUp ? "Sign Up" : "Sign In"}
                  </Button>
                  <Button variant="ghost" onClick={resetToRoleSelection} disabled={isLoading} className="w-full text-muted-foreground hover:text-primary transition-smooth flex items-center gap-2 justify-center">
                    <ChevronLeft className="h-4 w-4" />
                    Back to Role Selection
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button onClick={() => {setIsSignUp(!isSignUp); setError(null);}} disabled={isLoading} className="text-primary hover:underline font-medium disabled:opacity-50">
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </CardContent>
            </>
        </Card>
      </div>
    );
  }

  // --- Render Role Selection (Original Welcome Page Content - unchanged) ---
   return (
    <div className="min-h-screen hero-gradient">
       {/* Hero Section */}
      <div className="relative overflow-hidden">
         <div className="container mx-auto px-6 py-20">
              <div className="text-center space-y-8 max-w-4xl mx-auto">
              <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Modern Learning Platform
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                Learn <span className="text-gradient">Smarter</span>,<br />
                Teach <span className="text-gradient">Better</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                Professional educational platform with adaptive streaming, AI-powered content,
                and seamless collaboration between teachers and students.
              </p>
            </div>
            {/* Role Selection Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
              <Card
                className="card-elevated shadow-medium cursor-pointer group transition-bounce hover:scale-105 bg-background/80 backdrop-blur"
                // Reset states when role is chosen
                onClick={() => {setLoginMode("teacher"); setIsSignUp(false); setError(null);}}
              >
                 <CardHeader className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full gradient-secondary flex items-center justify-center group-hover:shadow-glow transition-smooth">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-foreground">I'm a Teacher</CardTitle>
                        <CardDescription className="text-muted-foreground">
                          Create content, manage students, and track progress
                        </CardDescription>
                      </div>
                 </CardHeader>
                 <CardContent>
                     <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 group-hover:shadow-medium transition-smooth">
                        Login / Sign Up <ChevronRight className="ml-2 h-4 w-4" />
                     </Button>
                 </CardContent>
              </Card>

              <Card
                className="card-elevated shadow-medium cursor-pointer group transition-bounce hover:scale-105 bg-background/80 backdrop-blur"
                // Reset states when role is chosen
                onClick={() => {setLoginMode("student"); setIsSignUp(false); setError(null);}}
              >
                 <CardHeader className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full gradient-accent flex items-center justify-center group-hover:shadow-glow transition-smooth">
                        <GraduationCap className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-foreground">I'm a Student</CardTitle>
                        <CardDescription className="text-muted-foreground">
                          Access courses, learn adaptively, and track your progress
                        </CardDescription>
                      </div>
                 </CardHeader>
                 <CardContent>
                     <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 group-hover:shadow-medium transition-smooth">
                         Login / Sign Up <ChevronRight className="ml-2 h-4 w-4" />
                     </Button>
                 </CardContent>
              </Card>
            </div>
             </div>
         </div>
      </div>

       {/* Features Section */}
      <div className="py-20 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6">
             <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl font-bold text-foreground">Why Choose Our Platform?</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                Built for modern education with accessibility, performance, and user experience at its core.
                </p>
            </div>
             <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  {features.map((feature, index) => (
                    <Card key={index} className="card-elevated shadow-medium text-center group hover:scale-105 transition-bounce bg-background/50">
                        <CardHeader className="space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-lg gradient-primary flex items-center justify-center group-hover:shadow-glow transition-smooth">
                            <feature.icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-foreground">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <CardDescription className="text-muted-foreground">
                            {feature.description}
                        </CardDescription>
                        </CardContent>
                    </Card>
                    ))}
             </div>
        </div>
      </div>
    </div>
  );
};