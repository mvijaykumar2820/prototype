// src/pages/LessonPage.tsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertTriangle } from 'lucide-react'; // Removed Download import
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Interfaces
interface Session {
  id: string;
  title: string;
  videoUrl?: string;
  courseId: string;
  createdAt: Timestamp;
}

interface Course {
  id: string;
  name: string;
}

const LessonPage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [user, loadingAuth] = useAuthState(auth);
  const [lesson, setLesson] = useState<Session | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lesson and course data
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId || !courseId) {
        setError("Invalid lesson or course ID");
        setIsLoading(false);
        return;
      }

      try {
        const lessonRef = doc(db, "sessions", lessonId);
        const lessonSnap = await getDoc(lessonRef);

        if (!lessonSnap.exists()) {
          throw new Error("Lesson not found");
        }

        const lessonData = { 
          id: lessonSnap.id, 
          ...lessonSnap.data() 
        } as Session;

        if (lessonData.courseId !== courseId) {
          throw new Error("Lesson does not belong to this course");
        }

        setLesson(lessonData);

        // Fetch course details
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        
        if (courseSnap.exists()) {
          setCourse({ 
            id: courseSnap.id, 
            name: courseSnap.data()?.name 
          } as Course);
        }
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || "Failed to load lesson");
      } finally {
        setIsLoading(false);
      }
    };

    if (!loadingAuth) {
      fetchLessonData();
    }
  }, [courseId, lessonId, loadingAuth]);

  // --- Render different states ---
  const renderContent = () => {
    if (isLoading || loadingAuth) {
      return (
        <div className="space-y-6 p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-10 w-3/4" />
          <AspectRatio ratio={16 / 9} className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <Skeleton className="h-full w-full" />
          </AspectRatio>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-destructive/10">
          <div className="text-center py-10 text-destructive space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto"/>
            <p className="font-medium">{error}</p>
            <Button variant="outline" size="sm" asChild className="border border-gray-300 dark:border-gray-600">
              <Link to={courseId ? `/course/${courseId}` : "/"}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Course Navigation - Remove duplicate /prototype/ */}
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to={courseId ? `/course/${courseId}` : "/"} className="hover:text-foreground">
              {course?.name || 'Course'}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{lesson?.title}</span>
          </div>
        </div>

        {/* Error state - Remove duplicate /prototype/ */}
        {error && (
          <Button variant="outline" size="sm" asChild className="border border-gray-300 dark:border-gray-600">
            <Link to={courseId ? `/course/${courseId}` : "/"}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
            </Link>
          </Button>
        )}

        {/* Main Content */}
        <div className="space-y-6 p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50">
          {/* Lesson Title */}
          <h1 className="text-2xl font-bold text-foreground">{lesson?.title}</h1>

          {/* Video Player */}
          {lesson?.videoUrl ? (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-black">
              <AspectRatio ratio={16 / 9}>
                <video
                  controls
                  src={lesson.videoUrl}
                  className="w-full h-full object-contain"
                  poster="/placeholder.svg"
                >
                  Your browser does not support the video tag.
                </video>
              </AspectRatio>
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600">
              <p className="text-muted-foreground">No video available for this lesson.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.history.back()}
          className="border border-gray-300 dark:border-gray-600 hover:bg-accent/50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Previous Page
        </Button>
      </div>

      {renderContent()}
    </div>
  );
};

export default LessonPage;