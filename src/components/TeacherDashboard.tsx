import { Upload, Plus, FileText, Brain, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const TeacherDashboard = () => {
  const quickActions = [
    {
      title: "Upload Content",
      description: "Add video, slides, and audio",
      icon: Upload,
      action: "upload",
      gradient: "gradient-primary"
    },
    {
      title: "Create Test",
      description: "Design quizzes and assessments",
      icon: Plus,
      action: "test",
      gradient: "gradient-secondary"
    },
    {
      title: "Generate Notes",
      description: "Auto-create session summaries",
      icon: FileText,
      action: "notes",
      gradient: "gradient-subtle"
    },
    {
      title: "AI Flashcards",
      description: "Generate learning cards",
      icon: Brain,
      action: "flashcards",
      gradient: "gradient-accent"
    }
  ];

  const recentSessions = [
    { id: 1, title: "Introduction to React", students: 24, date: "Today" },
    { id: 2, title: "JavaScript Fundamentals", students: 31, date: "Yesterday" },
    { id: 3, title: "HTML & CSS Basics", students: 28, date: "2 days ago" }
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Manage your educational content and track student progress</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action) => (
          <Card key={action.action} className="card-interactive group">
            <CardHeader className="pb-3">
              <div className={`w-12 h-12 rounded-lg ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-105 transition-bounce`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full transition-smooth">
                Get Started
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sessions & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <Card className="lg:col-span-2 card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Sessions
            </CardTitle>
            <CardDescription>Your latest educational content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-fast">
                  <div>
                    <h3 className="font-medium text-foreground">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">{session.date}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {session.students} students
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">156</div>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">24</div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">89%</div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};