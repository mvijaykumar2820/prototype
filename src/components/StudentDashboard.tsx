import { Play, BookOpen, Brain, Clock, Signal, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const StudentDashboard = () => {
  const availableSessions = [
    {
      id: 1,
      title: "Introduction to React",
      duration: "45 min",
      type: "video",
      progress: 75,
      hasNotes: true,
      hasFlashcards: true
    },
    {
      id: 2,
      title: "JavaScript Fundamentals",
      duration: "60 min",
      type: "slides",
      progress: 100,
      hasNotes: true,
      hasFlashcards: false
    },
    {
      id: 3,
      title: "HTML & CSS Basics",
      duration: "30 min",
      type: "video",
      progress: 0,
      hasNotes: false,
      hasFlashcards: false
    }
  ];

  const upcomingTests = [
    { id: 1, title: "React Quiz", dueDate: "Tomorrow", questions: 15 },
    { id: 2, title: "JavaScript Assessment", dueDate: "In 3 days", questions: 20 }
  ];

  // Simulate connection status (in real app, this would be dynamic)
  const connectionQuality = "good"; // "good" | "poor"

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header with Connection Status */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
          {connectionQuality === "good" ? (
            <>
              <Wifi className="h-4 w-4 text-success" />
              <span className="text-sm text-success">High Speed</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning">Low Bandwidth</span>
            </>
          )}
        </div>
      </div>

      {/* Learning Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Your Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableSessions.map((session) => (
            <Card key={session.id} className="card-interactive group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={session.type === "video" ? "default" : "secondary"}>
                    {session.type === "video" ? "Video + Audio" : "Slides + Audio"}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{session.duration}</span>
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-fast">
                  {session.title}
                </CardTitle>
                {session.progress > 0 && (
                  <div className="space-y-1">
                    <Progress value={session.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{session.progress}% complete</p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full group-hover:scale-105 transition-bounce">
                  <Play className="h-4 w-4 mr-2" />
                  {session.progress > 0 ? "Continue" : "Start"} Learning
                </Button>
                
                {/* Resource Links */}
                <div className="flex gap-2">
                  {session.hasNotes && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <BookOpen className="h-4 w-4 mr-1" />
                      Notes
                    </Button>
                  )}
                  {session.hasFlashcards && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Brain className="h-4 w-4 mr-1" />
                      Cards
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upcoming Tests & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tests */}
        <Card className="lg:col-span-2 card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Signal className="h-5 w-5" />
              Upcoming Tests
            </CardTitle>
            <CardDescription>Stay on track with your assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-fast">
                  <div>
                    <h3 className="font-medium text-foreground">{test.title}</h3>
                    <p className="text-sm text-muted-foreground">{test.questions} questions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{test.dueDate}</p>
                    <Button size="sm" className="mt-2">
                      Take Test
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Learning Progress */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">67%</div>
              <p className="text-sm text-muted-foreground">Course Completion</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">12</div>
              <p className="text-sm text-muted-foreground">Sessions Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">4.8</div>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};