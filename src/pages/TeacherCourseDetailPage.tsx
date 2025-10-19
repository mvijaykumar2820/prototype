// src/pages/TeacherCourseDetailPage.tsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth, storage } from '@/lib/firebase'; // Import storage
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc, collectionGroup, getCountFromServer,
         deleteDoc // Import deleteDoc
       } from 'firebase/firestore';
import { ref, deleteObject } from "firebase/storage"; // Import ref and deleteObject
import { useAuthState } from 'react-firebase-hooks/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Clock, Users, Edit, Trash2, BarChart, Loader2 } from 'lucide-react'; // Added Loader2
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner"; // Import toast for notifications

// Interfaces
interface Session {
  id: string;
  title: string;
  videoUrl?: string; // Need this to delete from storage
  duration?: string; // Use optional chaining as it might not exist on older data
  createdAt: Timestamp;
}

interface Course {
    id: string;
    name: string;
    description?: string;
    teacherId: string; // Ensure this is part of the interface if fetched
    teacherName?: string;
}

const TeacherCourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [user, loadingAuth] = useAuthState(auth);
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track which lesson is being deleted
  const [error, setError] = useState<string | null>(null);

  // Fetch course details
  useEffect(() => {
    const fetchCourseDetails = async () => {
       if (!courseId) { setIsLoadingCourse(false); setError("Invalid Course ID."); return; }
       setIsLoadingCourse(true); setError(null);
       try {
         const courseRef = doc(db, "courses", courseId);
         const courseSnap = await getDoc(courseRef);
         if (courseSnap.exists()) {
             // Check ownership
             if (user && courseSnap.data()?.teacherId === user.uid) {
                setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course);
             } else if (user) { // User is loaded but doesn't own the course
                 setError("You do not have permission to view this course.");
                 setCourse(null);
             } else { // User is not loaded yet or not logged in
                 setError("Authentication required.");
                 setCourse(null);
             }
         } else { setError("Course not found."); setCourse(null); }
       } catch (err) { console.error("Error fetching course details:", err); setError("Failed to load course details."); setCourse(null); }
       finally { setIsLoadingCourse(false); }
    };
     // Fetch only when auth state is resolved and we have a user
     if (!loadingAuth && user) {
        fetchCourseDetails();
     } else if (!loadingAuth && !user) {
         // If auth finished loading and there's no user, set appropriate state
         setIsLoadingCourse(false);
         setError("Please log in to view courses.");
         setCourse(null); // Ensure course is null if not logged in
     }
  }, [courseId, user, loadingAuth]); // Rerun if user, loadingAuth, or courseId changes

  // Fetch sessions for this course
  useEffect(() => {
    const fetchCourseSessions = async () => {
        if (!courseId || !course) return; // Ensure course object exists
        setIsLoadingSessions(true);
        // Don't clear main error, maybe use separate sessionError state if needed
       try {
         const sessionsRef = collection(db, "sessions");
         const q = query( sessionsRef, where("courseId", "==", courseId), orderBy("createdAt", "asc") );
         const querySnapshot = await getDocs(q);
         const fetchedSessions = querySnapshot.docs.map(doc => ({
           id: doc.id,
           duration: doc.data().duration || "N/A", // Use actual duration or fallback
           ...doc.data()
         })) as Session[];
         setSessions(fetchedSessions);
         // Clear only session-specific errors here if separate state exists
         // Clear error if it was specifically about lessons
         if(error === "Failed to load lessons.") setError(null);
       } catch (err) { console.error("Error fetching sessions:", err); setError("Failed to load lessons."); setSessions([]); }
       finally { setIsLoadingSessions(false); }
    };
    // Fetch sessions only if course loaded successfully and belongs to user
    if (!isLoadingCourse && course) {
        fetchCourseSessions();
    } else {
        setIsLoadingSessions(false);
        setSessions([]); // Clear sessions if course isn't loaded
    }
  }, [courseId, course, isLoadingCourse, error]); // Rerun if course object changes or specific error occurred

  // Fetch Analytics (Student Count)
  useEffect(() => {
    const fetchAnalytics = async () => {
        if (!courseId || !course) return; // Ensure course object exists
        setIsLoadingAnalytics(true);
        try {
            // Inefficient client-side count (okay for hackathon)
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("role", "==", "student"));
            const querySnapshot = await getDocs(q);
            let count = 0;
            querySnapshot.forEach((doc) => {
                const enrollments = doc.data().enrollments as Array<{ courseId: string }>;
                if (Array.isArray(enrollments) && enrollments.some(e => e.courseId === courseId)) {
                    count++;
                }
            });
            setStudentCount(count);
        } catch (err) {
            console.error("Error fetching student count:", err);
            setStudentCount(null);
        } finally {
            setIsLoadingAnalytics(false);
        }
    };
     if (!isLoadingCourse && course) {
        fetchAnalytics();
     } else {
         setIsLoadingAnalytics(false);
         setStudentCount(null);
     }
  }, [courseId, course, isLoadingCourse]);

   // Placeholder for Edit
   const handleEditLesson = (sessionId: string) => { alert(`Edit lesson ${sessionId} - Not implemented`); };

   // --- Delete Lesson Function ---
   const handleDeleteLesson = async (sessionToDelete: Session) => {
       if (!user) { toast.error("Authentication required."); return; }
       if (isDeleting) return; // Prevent concurrent deletes

       setIsDeleting(sessionToDelete.id);
       console.log(`Attempting to delete lesson ${sessionToDelete.id} (${sessionToDelete.title})`);
       toast.info(`Deleting lesson "${sessionToDelete.title}"...`);

       try {
           // 1. Delete Firestore Document
           const sessionRef = doc(db, "sessions", sessionToDelete.id);
           await deleteDoc(sessionRef);
           console.log("Firestore document deleted.");

           // 2. Delete Video File from Storage (if URL exists)
           if (sessionToDelete.videoUrl) {
               try {
                   const storageRef = ref(storage, sessionToDelete.videoUrl); // Get ref from full URL
                   await deleteObject(storageRef);
                   console.log("Storage file deleted.");
               } catch (storageError: any) {
                   console.error("Error deleting storage file:", storageError);
                   if (storageError.code !== 'storage/object-not-found') {
                       toast.warning(`Lesson data deleted, but failed to delete video file.`);
                   } // Ignore if file already gone
               }
           }

           // 3. Update UI State
           setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionToDelete.id));
           toast.success(`Lesson "${sessionToDelete.title}" deleted!`);

       } catch (err: any) { // Catch specific errors if possible
           console.error("Error deleting lesson:", err);
           toast.error(`Failed to delete lesson: ${err.message || 'Please try again.'}`);
       } finally {
           setIsDeleting(null); // Reset deleting state
       }
   };

  // --- Helper to render session list ---
  const renderSessionContent = () => {
    if (isLoadingSessions) {
      return Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-4 border-2 border-gray-300 dark:border-gray-600">
          <Skeleton className="h-5 w-full" />
        </Card>
      ));
    }

    if (Array.isArray(sessions) && sessions.length > 0) {
      return sessions.map((session, index) => (
        <Card 
          key={session.id} 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 
                   border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
        >
          <div className="flex-1 mb-3 sm:mb-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">{session.title}</h3>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              {session.videoUrl && <Badge variant="outline">Video</Badge>}
              {session.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {session.duration}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border border-gray-300 dark:border-gray-600"
              onClick={() => handleEditLesson(session.id)}
              disabled={!!isDeleting}
            >
              <Edit className="h-3 w-3 mr-1"/> Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={!!isDeleting}
                >
                  {isDeleting === session.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-3 w-3 mr-1"/>
                      Delete
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lesson?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{session.title}" and its video content.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDeleteLesson(session)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      ));
    }

    return (
      <Card className="border-2 border-gray-300 dark:border-gray-600">
        <CardContent className="pt-6 text-center text-gray-600 dark:text-gray-400">
          No lessons have been added to this course yet.
        </CardContent>
      </Card>
    );
  };


  // --- Main Return ---
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button variant="outline" size="sm" asChild className="border border-gray-300 dark:border-gray-600">
          <Link to="/"> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard </Link>
      </Button>

      {/* Course Header with stronger border */}
      {isLoadingCourse ? (
          <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50 space-y-3">
            <Skeleton className="h-8 w-3/5 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
      ) : course ? (
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50 space-y-3">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{course.name}</h1>
                {course.description && <p className="text-muted-foreground mt-2">{course.description}</p>}
            </div>
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                 <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                   <BarChart className="h-5 w-5"/> Analytics
                 </h2>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <Users className="h-4 w-4"/>
                     {isLoadingAnalytics ? <Skeleton className="h-4 w-32"/> : 
                      studentCount !== null ? `${studentCount} student(s) enrolled` : "Could not load student count"}
                 </div>
            </div>
        </div>
      ) : (
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-destructive/10">
          <p className="text-destructive text-center">{error || 'Course could not be loaded.'}</p>
        </div>
      )}

      {/* Sessions List with consistent border */}
      {!isLoadingCourse && course && (
          <div className="space-y-4 p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Lessons</h2>
            </div>
            <div className="space-y-3">
              {renderSessionContent()}
            </div>
          </div>
      )}
    </div>
  );
};

export default TeacherCourseDetailPage;