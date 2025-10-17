// src/components/StudentDashboard.tsx

import { useState, useEffect } from "react";
import { Play, BookOpen, Brain, Clock, Signal, Wifi, WifiOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/firebase"; // Import Firestore
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useNetworkState } from "@/hooks/useNetworkState"; // Import network hook
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

// Define the structure of a session document from Firestore
interface Session {
  id: string;
  title: string;
  videoUrl?: string;
  slidesUrl?: string;
  audioUrl?: string;
  createdAt: any; // Firestore Timestamp
  // --- Dummy data for demo - replace later ---
  duration: string;
  progress: number;
  hasNotes: boolean;
  hasFlashcards: boolean;
}

export const StudentDashboard = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const networkStatus = useNetworkState(); // 'good', 'moderate', 'poor'

  // Fetch sessions from Firestore when the component loads
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const sessionsCollection = collection(db, "sessions");
        const q = query(sessionsCollection, orderBy("createdAt", "desc")); // Get newest first
        const sessionSnapshot = await getDocs(q);
        const sessionList = sessionSnapshot.docs.map(doc => ({
            id: doc.id,
            // --- Add dummy data - replace with real data later ---
            duration: `${Math.floor(Math.random() * 30) + 30} min`,
            progress: Math.floor(Math.random() * 101),
            hasNotes: Math.random() > 0.5,
            hasFlashcards: Math.random() > 0.5,
            ...doc.data()
        })) as Session[];
        setSessions(sessionList);
      } catch (error) {
        console.error("Error fetching sessions: ", error);
        // Maybe show an error message to the user
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // --- NEW: Handle Learning Button Click ---
  const handleStartLearning = (session: Session) => {
    const isGoodConnection = networkStatus === 'good' || networkStatus === 'moderate';
    let urlToOpen: string | undefined;

    if (isGoodConnection && session.videoUrl) {
      // Stream Video
      urlToOpen = session.videoUrl;
    } else if (!isGoodConnection && session.videoUrl) {
       // Download Video for low connection
      urlToOpen = session.videoUrl;
      // Trigger download - Browsers handle this differently, simple link works for most
      const link = document.createElement('a');
      link.href = urlToOpen;
      link.download = session.title.replace(/[^a-zA-Z0-9]/g, '_') + '.mp4'; // Suggest a filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`Download initiated for: ${session.title}`);
      return; // Stop here after initiating download
    } else if (session.slidesUrl && session.audioUrl) {
      // Stream Slides + Audio (or just show slides for now)
      urlToOpen = session.slidesUrl; // Simple implementation: just open slides PDF
      console.log(`Opening slides for: ${session.title}`);
    } else if (session.videoUrl) {
        // Fallback to video if slides/audio not present
        urlToOpen = session.videoUrl;
    }


    if (urlToOpen) {
      console.log(`Opening URL: ${urlToOpen}`);
      window.open(urlToOpen, '_blank', 'noopener,noreferrer'); // Open in new tab
    } else {
      console.warn("No suitable content URL found for this session:", session.title);
      alert("Could not find content for this session.");
    }
  };


  // --- DUMMY DATA ---
  const upcomingTests = [
    { id: 1, title: "React Quiz", dueDate: "Tomorrow", questions: 15 },
    { id: 2, title: "JavaScript Assessment", dueDate: "In 3 days", questions: 20 }
  ];

  // --- DYNAMIC BADGE ---
  const getSessionBadge = (session: Session) => {
    const hasVideo = !!session.videoUrl;
    const hasSlides = !!session.slidesUrl && !!session.audioUrl;

    if ((networkStatus === 'good' || networkStatus === 'moderate') && hasVideo) {
      return <Badge variant="default">Video + Audio</Badge>;
    }
    if (hasSlides) {
      return <Badge variant="secondary">Slides + Audio</Badge>;
    }
    // Fallback if only one type is available
    if (hasVideo) return <Badge variant="default">Video Only</Badge>;
    if (hasSlides) return <Badge variant="secondary">Slides + Audio</Badge>;
    return <Badge variant="outline">No Content</Badge>;
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header with Connection Status */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
          {networkStatus === "good" || networkStatus === 'moderate' ? (
            <><Wifi className="h-4 w-4 text-success" /><span className="text-sm text-success">High Speed</span></>
          ) : (
            <><WifiOff className="h-4 w-4 text-warning" /><span className="text-sm text-warning">Low Bandwidth</span></>
          )}
        </div>
      </div>

      {/* Learning Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Your Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Show skeleton loaders while fetching data
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3 space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-2 w-full" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                     <div className="flex gap-2">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-8 w-1/2" />
                    </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Display fetched sessions
            sessions.map((session) => (
              <Card key={session.id} className="card-interactive group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    {getSessionBadge(session)}
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
                  {/* --- UPDATED BUTTON --- */}
                  <Button
                    className="w-full group-hover:scale-105 transition-bounce"
                    onClick={() => handleStartLearning(session)}
                  >
                    {(networkStatus === 'good' || networkStatus === 'moderate') || (!session.videoUrl && session.slidesUrl) ? (
                        <Play className="h-4 w-4 mr-2" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    {session.progress > 0 ? "Continue" : "Start"} Learning
                    {(networkStatus !== 'good' && networkStatus !== 'moderate') && session.videoUrl && " (Download)"}
                  </Button>
                  
                  {/* --- Resource Links (Dummy for now) --- */}
                  <div className="flex gap-2">
                    {session.hasNotes && (
                      <Button variant="outline" size="sm" className="flex-1" disabled>
                        <BookOpen className="h-4 w-4 mr-1" />
                        Notes
                      </Button>
                    )}
                    {session.hasFlashcards && (
                      <Button variant="outline" size="sm" className="flex-1" disabled>
                        <Brain className="h-4 w-4 mr-1" />
                        Cards
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {/* Show message if no sessions found */}
        {!isLoading && sessions.length === 0 && (
            <Card className="col-span-full">
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No learning sessions have been uploaded yet. Please check back later or contact your teacher.</p>
                </CardContent>
            </Card>
        )}
      </div>

      {/* Upcoming Tests & Progress (Dummy data) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Signal className="h-5 w-5" />Upcoming Tests</CardTitle>
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
                    <Button size="sm" className="mt-2" disabled>Take Test</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle>Your Progress</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center"><div className="text-3xl font-bold text-primary">67%</div><p className="text-sm text-muted-foreground">Course Completion</p></div>
            <div className="text-center"><div className="text-3xl font-bold text-secondary">12</div><p className="text-sm text-muted-foreground">Sessions Completed</p></div>
            <div className="text-center"><div className="text-3xl font-bold text-accent">4.8</div><p className="text-sm text-muted-foreground">Average Score</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};