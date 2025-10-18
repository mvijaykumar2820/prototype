// src/pages/CourseDetailPage.tsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Play, Download, Wifi, WifiOff, Clock, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNetworkState } from '@/hooks/useNetworkState';

// Interfaces
interface Session {
  id: string;
  title: string;
  videoUrl?: string;
  slidesUrl?: string;
  audioUrl?: string;
  courseId: string;
  createdAt: Timestamp;
  // Dummy data
  duration: string;
  progress: number;
}

interface Course {
    id: string;
    name: string;
    description?: string;
    teacherName?: string;
}

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [user] = useAuthState(auth);
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]); // Initialized as array
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const networkStatus = useNetworkState();

  // --- Fetch Course Details (No changes) ---
  useEffect(() => {
    const fetchCourseDetails = async () => {
       if (!courseId) { setIsLoadingCourse(false); setError("Invalid Course ID."); return; }
       setIsLoadingCourse(true); setError(null);
       try {
         const courseRef = doc(db, "courses", courseId);
         const courseSnap = await getDoc(courseRef);
         if (courseSnap.exists()) { setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course); }
         else { setError("Course not found."); setCourse(null); }
       } catch (err) { console.error("Error fetching course details:", err); setError("Failed to load course details."); setCourse(null); }
       finally { setIsLoadingCourse(false); }
    };
    fetchCourseDetails();
  }, [courseId]);

  // --- Fetch Sessions (No changes) ---
  useEffect(() => {
    const fetchCourseSessions = async () => {
       if (!courseId) { setIsLoadingSessions(false); setSessions([]); return; }
       setIsLoadingSessions(true);
       try {
         const sessionsRef = collection(db, "sessions");
         const q = query( sessionsRef, where("courseId", "==", courseId), orderBy("createdAt", "asc") );
         const querySnapshot = await getDocs(q);
         const fetchedSessions = querySnapshot.docs.map(doc => ({
           id: doc.id,
           duration: `${Math.floor(Math.random() * 30) + 15} min`,
           progress: Math.floor(Math.random() * 101),
           ...doc.data()
         })) as Session[];
         setSessions(fetchedSessions);
         setError(null);
       } catch (err) { console.error("Error fetching sessions for course:", err); setError("Failed to load course lessons."); setSessions([]); }
       finally { setIsLoadingSessions(false); }
    };
    if (courseId) { fetchCourseSessions(); }
    else { setIsLoadingSessions(false); setSessions([]); }
  }, [courseId]);

   // --- Handle Play/Download (No changes) ---
   const handleStartLearning = (session: Session) => {
     const isGoodConnection = networkStatus === 'good' || networkStatus === 'moderate';
     let urlToOpen: string | undefined; let isDownload = false;
     if (isGoodConnection && session.videoUrl) { urlToOpen = session.videoUrl; }
     else if (!isGoodConnection && session.videoUrl) { urlToOpen = session.videoUrl; isDownload = true; }
     else if (session.slidesUrl && session.audioUrl) { urlToOpen = session.slidesUrl; }
     else if (session.videoUrl) { urlToOpen = session.videoUrl; }
     if (urlToOpen) {
       if (isDownload) { const link = document.createElement('a'); link.href = urlToOpen; link.download = session.title.replace(/[^a-zA-Z0-9]/g, '_') + '.mp4'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
       else { window.open(urlToOpen, '_blank', 'noopener,noreferrer'); }
     } else { alert("Could not find content for this lesson."); }
   };

   // --- Get Badge (No changes) ---
   const getSessionBadge = (session: Session) => {
       const hasVideo = !!session.videoUrl; const hasSlides = !!session.slidesUrl && !!session.audioUrl;
       if ((networkStatus === 'good' || networkStatus === 'moderate') && hasVideo) { return <Badge variant="default">Video + Audio</Badge>; }
       if (hasSlides) { return <Badge variant="secondary">Slides + Audio</Badge>; }
       if (hasVideo) return <Badge variant="default">Video Only</Badge>;
       if (hasSlides) return <Badge variant="secondary">Slides + Audio</Badge>;
       return <Badge variant="outline">No Content</Badge>;
   };

  // --- Helper function to render sessions (Structure Change) ---
  const renderSessionContent = () => {
    if (isLoadingSessions) {
      return Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-4 border border-gray-300 dark:border-gray-600 rounded-md">
          <Skeleton className="h-5 w-full" />
        </Card>
      ));
    }

    if (error) {
      return <p className="text-destructive text-center py-4">{error}</p>;
    }

    if (Array.isArray(sessions) && sessions.length > 0) {
      return sessions.map((session, index) => (
        <Card
          key={session.id}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors border border-gray-300 dark:border-gray-600 rounded-md"
        >
          <div className="flex-1 mb-3 sm:mb-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-muted-foreground">{(index + 1).toString().padStart(2, '0')}</span>
              <h3 className="font-semibold text-foreground">{session.title}</h3>
              {session.progress === 100 && <BadgeCheck className="h-4 w-4 text-success shrink-0" />}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {getSessionBadge(session)}
              <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {session.duration}</div>
            </div>
          </div>
          <Button size="sm" onClick={() => handleStartLearning(session)}>
            {(networkStatus === 'good' || networkStatus === 'moderate') || (!session.videoUrl && session.slidesUrl) ? ( <Play className="h-4 w-4 mr-2" /> ) : ( <Download className="h-4 w-4 mr-2" /> )}
            {session.progress > 0 ? "Continue" : "Start"}
            {(networkStatus !== 'good' && networkStatus !== 'moderate') && session.videoUrl && " (Download)"}
          </Button>
        </Card>
      ));
    }

    return <p className="text-muted-foreground text-center py-4">No lessons have been added to this course yet.</p>;
  };
  

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button variant="outline" size="sm" asChild>
          <Link to="/"> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard </Link>
      </Button>

      {/* Course Header */}
      {isLoadingCourse ? (
        <div className="space-y-2">
          <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-md">
            <Skeleton className="h-8 w-3/5" />
            <Skeleton className="h-4 w-4/5 mt-3" />
          </div>
        </div>
      ) : course ? (
        <div className="space-y-2">
          <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-md">
            <h1 className="text-3xl font-bold text-foreground">{course.name}</h1>
            {course.description && <p className="text-muted-foreground mt-2">{course.description}</p>}
            {course.teacherName && <p className="text-sm text-muted-foreground mt-1">Taught by: {course.teacherName}</p>}
          </div>
        </div>
      ) : (
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-md">
          <p className="text-destructive">{error || 'Course details could not be loaded.'}</p>
        </div>
      )}

      <hr className="border-border" />

      {/* Sessions List */}
      <div className="space-y-4">
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-md">
          <h2 className="text-xl font-semibold text-foreground">Lessons</h2>
          <div className="space-y-3 mt-3">
            {renderSessionContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;