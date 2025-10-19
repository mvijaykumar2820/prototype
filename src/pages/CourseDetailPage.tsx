// src/pages/CourseDetailPage.tsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Make sure Link is imported
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Play, Download, Wifi, WifiOff, Clock, BadgeCheck, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNetworkState } from '@/hooks/useNetworkState';
import { AspectRatio } from "@/components/ui/aspect-ratio"; // Keep AspectRatio import

// Interfaces
interface Session {
  id: string;
  title: string;
  videoUrl?: string;
  duration?: string; // Actual duration from Firestore
  courseId: string;
  createdAt: Timestamp;
  progress?: number; // Keep dummy progress for now
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
  // --- Initialize state as null ---
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  // --- Use separate error state for sessions ---
  const [courseError, setCourseError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const networkStatus = useNetworkState();
  const [showLowNetworkMsg, setShowLowNetworkMsg] = useState(networkStatus === 'poor');

  // Update low network message visibility
  useEffect(() => {
    setShowLowNetworkMsg(networkStatus === 'poor');
  }, [networkStatus]);

  // Fetch course details
  useEffect(() => {
    const fetchCourseDetails = async () => {
       if (!courseId) { setIsLoadingCourse(false); setCourseError("Invalid Course ID."); return; }
       setIsLoadingCourse(true); setCourseError(null); // Clear course error on start
       try {
         const courseRef = doc(db, "courses", courseId);
         const courseSnap = await getDoc(courseRef);
         if (courseSnap.exists()) { setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course); }
         else { setCourseError("Course not found."); setCourse(null); }
       } catch (err) { console.error("Error fetching course details:", err); setCourseError("Failed to load course details."); setCourse(null); }
       finally { setIsLoadingCourse(false); }
    };
    fetchCourseDetails();
  }, [courseId]);

  // Fetch sessions for this course
  useEffect(() => {
    const fetchCourseSessions = async () => {
       if (!courseId) { setIsLoadingSessions(false); setSessions([]); return; } // Set empty if no ID
       setIsLoadingSessions(true); setSessionError(null); // Clear session error on start
       setSessions(null); // Reset sessions to null while loading
       try {
         const sessionsRef = collection(db, "sessions");
         const q = query( sessionsRef, where("courseId", "==", courseId), orderBy("createdAt", "asc") );
         const querySnapshot = await getDocs(q);
         const fetchedSessions = querySnapshot.docs.map(doc => ({
           id: doc.id,
           duration: doc.data().duration || "N/A", // Use actual duration
           progress: Math.floor(Math.random() * 101), // Dummy progress
           ...doc.data()
         })) as Session[];
         console.log("[fetchCourseSessions] Fetched sessions:", fetchedSessions); // Log fetched data
         setSessions(fetchedSessions); // Sets an array (even if empty)
       } catch (err) {
           console.error("Error fetching sessions for course:", err);
           setSessionError("Failed to load course lessons.");
           setSessions([]); // Set empty array explicitly on error
        } finally {
            console.log("[fetchCourseSessions] Finished fetch, setting loading false.");
            setIsLoadingSessions(false);
        }
    };
    // Fetch only if course ID is valid
    if (courseId) {
        fetchCourseSessions();
    } else {
        setIsLoadingSessions(false);
        setSessions([]); // Ensure empty array if no courseId
    }
  }, [courseId]); // Only depend on courseId

  // --- Handle Download ---
   const handleDownloadVideo = (session: Session) => {
     console.log(`handleDownloadVideo called for "${session.title}"`);
     const urlToOpen = session.videoUrl;
     if (urlToOpen) {
       try {
           const link = document.createElement('a'); link.href = urlToOpen;
           link.download = `${course?.name || 'course'}_${session.title.replace(/[^a-zA-Z0-9]/g, '_') || 'lesson'}.mp4`;
           document.body.appendChild(link); link.click(); document.body.removeChild(link);
           console.log('Download link clicked.');
       } catch (e) { console.error("Error triggering download:", e); alert("Could not start download."); }
     } else { console.error("Download failed: No video URL."); alert("Could not find video URL."); }
   };

   // --- Get Session Badge ---
   const getSessionBadge = (session: Session): JSX.Element => {
       const hasVideo = !!session.videoUrl;
       if (hasVideo) { return <Badge variant="outline">Video</Badge>; }
       return <Badge variant="destructive">No Content</Badge>;
   };

  // --- Helper function to render sessions ---
  const renderSessionContent = () => {
    console.log("[renderSessionContent] State:", { isLoadingSessions, sessionError, sessions, isArray: Array.isArray(sessions) }); // Log state

    if (isLoadingSessions) {
      console.log("[renderSessionContent] Rendering: Loading Skeletons");
      return Array.from({ length: 3 }).map((_, i) => (
        // Use Card with border for skeleton consistency
        <Card key={i} className="p-4 border border-gray-300 dark:border-gray-600 rounded-md">
            <Skeleton className="h-5 w-full" />
        </Card>
      ));
    }

    if (sessionError) {
        console.log("[renderSessionContent] Rendering: Error Message");
        return <p className="text-destructive text-center py-4">{sessionError}</p>;
    }

    // --- MOST IMPORTANT CHECK ---
    // Check if sessions is specifically an array AFTER loading is false and no error
    if (Array.isArray(sessions)) {
        if (sessions.length === 0) {
             console.log("[renderSessionContent] Rendering: Empty Array Message");
             // Show empty message only if course loading is also done
             if (!isLoadingCourse) {
                return <p className="text-muted-foreground text-center py-4">No lessons have been added yet.</p>;
             } else {
                 return null; // Don't show empty message while course is still loading
             }
        }

        // If we get here, sessions MUST be a non-empty array
        console.log("[renderSessionContent] Rendering: Mapping Sessions Array", sessions);
        try {
            // --- THE .map() CALL ---
            return sessions.map((session, index) => {
                const isGoodConnection = networkStatus === 'good' || networkStatus === 'moderate';
                const lessonPath = `/course/${courseId}/lesson/${session.id}`;

                return (
                  <Card 
                    key={session.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 border-gray-300 dark:border-gray-600 rounded-md"
                  >
                    {/* Session Details */}
                    <div className="flex-1 space-y-2 mb-3 sm:mb-0 mr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Lesson {(index + 1).toString().padStart(2, '0')}
                        </span>
                        <h3 className="font-semibold text-foreground">{session.title}</h3>
                        {session.progress === 100 && <BadgeCheck className="h-4 w-4 text-success" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {getSessionBadge(session)}
                        {session.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {session.duration}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Updated Button Section - Always show Start button with warning if needed */}
                    <div className="flex flex-col gap-2 items-end">
                      {networkStatus === 'poor' && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 mb-1">
                          <WifiOff className="h-3 w-3" />
                          <span>Poor connection - May experience buffering</span>
                        </div>
                      )}
                      <Link to={`/course/${courseId}/lesson/${session.id}`}>
                        <Button 
                          size="sm" 
                          className="bg-primary text-white hover:bg-primary/90"
                        >
                          <Play className="h-4 w-4 mr-2" /> Start Lesson
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ); // End return inside map
            }); // End map call
        } catch (mapError) {
             console.error("!!! CRITICAL FUCKING ERROR DURING MAP !!! sessions value:", sessions, "Type:", typeof sessions, "Is Array:", Array.isArray(sessions), "Error:", mapError);
             return <p className="text-destructive text-center py-4">Fucked up displaying lessons. Tell the dev.</p>;
        }

    } else {
        // If sessions is NOT an array after loading
        console.error("[renderSessionContent] Rendering: Fallback - sessions is NOT an array!", { sessions });
        // Show empty message only if course loaded okay and no specific session error
        if (!isLoadingCourse && course && !sessionError) {
             return <p className="text-muted-foreground text-center py-4">No lessons have been added yet.</p>;
        }
        // Otherwise return error or null
        return <p className="text-destructive text-center py-4">Could not load lesson data correctly.</p>;
    }
  };


  // --- Main Return ---
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button variant="outline" size="sm" asChild className="border border-gray-300 dark:border-gray-600">
        <Link to="/"> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard </Link>
      </Button>

      {/* Low Network Alert */}
      {showLowNetworkMsg && (
        <Alert className="border border-yellow-300 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-950/50 backdrop-blur-sm">
          <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-semibold">
            Low Network Connection Detected
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Your internet connection is slow. You may experience buffering while watching videos. 
            Consider downloading videos for better viewing experience.
          </AlertDescription>
        </Alert>
       )}

      {/* Course Header */}
      {isLoadingCourse ? (
        <div className="space-y-4 p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50 backdrop-blur-sm"> <Skeleton className="h-8 w-3/5" /> <Skeleton className="h-4 w-4/5" /> </div>
       ) : course ? (
        <div className="space-y-4 p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-foreground">{course.name}</h1>
          {course.description && ( <p className="text-muted-foreground">{course.description}</p> )}
          {course.teacherName && ( <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 p-2 border border-gray-200 dark:border-gray-700 rounded bg-muted/50"> <span className="font-medium">Instructor:</span> {course.teacherName} </div> )}
        </div>
       ) : (
        <div className="p-6 border border-destructive/50 rounded-lg bg-destructive/10"> <p className="text-destructive text-center font-medium"> {courseError || 'Course details could not be loaded.'} </p> </div>
       )}

      {!isLoadingCourse && course && <hr className="border-gray-200 dark:border-gray-700" />}

      {/* Sessions List */}
      {!isLoadingCourse && course && (
        <div className="space-y-6 p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"> <Play className="h-5 w-5" /> Course Content </h2>
          <div className="space-y-4">
            {renderSessionContent()}
          </div>
        </div>
      )}
      {/* Show session error even if course loading fails, if relevant */}
      {sessionError && !isLoadingSessions && (
           <div className="p-6 border border-destructive/50 rounded-lg bg-destructive/10"> <p className="text-destructive text-center font-medium"> {sessionError} </p> </div>
      )}
    </div>
  );
};

export default CourseDetailPage;