import { useState } from "react";
import { WelcomePage } from "@/components/WelcomePage";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { StudentDashboard } from "@/components/StudentDashboard";
import { AIChatbot } from "@/components/AIChatbot";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"teacher" | "student" | null>(null);

  const handleLogin = (role: "teacher" | "student") => {
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
  };

  // Show welcome page if not logged in
  if (!isLoggedIn) {
    return (
      <>
        <WelcomePage onLogin={handleLogin} />
        <AIChatbot />
      </>
    );
  }

  // Show appropriate dashboard based on role
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation Header */}
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
              Welcome, <span className="font-medium text-foreground capitalize">{userRole}</span>
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

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {userRole === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
      </main>

      {/* AI Chatbot */}
      <AIChatbot />

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 backdrop-blur">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 EduPlatform. Designed for accessible, adaptive learning.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;