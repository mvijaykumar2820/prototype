import { useState } from "react";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { StudentDashboard } from "@/components/StudentDashboard";

const Index = () => {
  const [currentRole, setCurrentRole] = useState<"teacher" | "student">("student");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <h1 className="text-xl font-bold text-foreground">EduPlatform</h1>
          </div>
          
          <RoleSwitcher currentRole={currentRole} onRoleChange={setCurrentRole} />
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {currentRole === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
      </main>

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