// src/components/TeacherDashboard.tsx

import { useState, useEffect } from "react";
import { Upload, Plus, FileText, Brain, BarChart3, Users, BookMarked, Loader2 } from "lucide-react"; // Added BookMarked, Loader2
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadContentDialog } from "./UploadContentDialog";
import { CreateCourseDialog } from "./CreateCourseDialog"; // Import the new dialog
import { db, auth } from "@/lib/firebase"; // Import db and auth
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link } from 'react-router-dom'; // Import Link
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

// Define Course structure
interface Course {
    id: string;
    name: string;
    description?: string;
    createdAt: any;
}

export const TeacherDashboard = () => {
  const [user, loadingAuth] = useAuthState(auth); // Get current teacher
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  // --- NEW: Fetch teacher's courses ---
  const fetchCourses = async () => {
    console.log("fetchCourses called in TeacherDashboard!"); // ADD THIS
      if (!user) return; // Don't fetch if user isn't loaded
      setIsLoadingCourses(true);
      try {
          const coursesRef = collection(db, "courses");
          // Query courses where teacherId matches the current user's ID
          const q = query(
              coursesRef,
              where("teacherId", "==", user.uid),
              orderBy("createdAt", "desc") // Show newest first
          );
          const querySnapshot = await getDocs(q);
          const fetchedCourses = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          })) as Course[];
          console.log("Setting courses state:", fetchedCourses);
          setCourses(fetchedCourses);
      } catch (error) {
          console.error("Error fetching courses:", error);
          // Handle error display if needed
      } finally {
          setIsLoadingCourses(false);
      }
  };

  // Fetch courses when the component loads or user changes
  useEffect(() => {
    if (user) {
      fetchCourses();
    } else if (!loadingAuth) {
        // If auth is done loading and there's still no user
        setIsLoadingCourses(false);
        setCourses([]); // Clear courses if user logs out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingAuth]); // Dependency array includes user and loadingAuth


  // --- Action handling remains similar ---
  const handleActionClick = (action: string) => {
    if (action === "upload") {
      setUploadDialogOpen(true);
    } else {
      alert(`Action "${action}" triggered! (Not implemented yet)`);
    }
  };

  const quickActions = [
    { title: "Upload Content", description: "Add a lesson to a course", icon: Upload, action: "upload", gradient: "gradient-primary" },
    { title: "Create Test", description: "Design quizzes for a course", icon: Plus, action: "test", gradient: "gradient-secondary" },
    { title: "Generate Notes", description: "Auto-create session summaries", icon: FileText, action: "notes", gradient: "gradient-subtle" },
    { title: "AI Flashcards", description: "Generate learning cards", icon: Brain, action: "flashcards", gradient: "gradient-accent" }
  ];

  // Dummy recent sessions - we might change this later
  const recentSessions = [
    { id: 1, title: "React Lesson 1 Uploaded", students: 0, date: "Today" },
    { id: 2, title: "JS Basics Course Created", students: 0, date: "Yesterday" }
  ];


  return (
    <>
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
             <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
                <p className="text-muted-foreground">Manage your courses and track student progress</p>
             </div>
             {/* Add Create Course Button here */}
             <CreateCourseDialog onCourseCreated={fetchCourses} /> {/* Pass fetchCourses to refresh list */}
        </div>


        {/* --- NEW: My Courses Section --- */}
        <div className="space-y-4 p-6 border border-border/50 rounded-lg bg-background/50 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"> <BookMarked className="h-5 w-5"/> My Courses </h2>
            {isLoadingCourses ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3 mt-2" /></CardContent></Card>
                    ))}
                 </div>
            ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Link key={course.id} to={`/teacher/course/${course.id}`} className="no-underline">
                            <Card className="card-interactive group flex flex-col h-full"> {/* Added h-full */}
                                <CardHeader className="flex-grow">
                                    <CardTitle className="text-lg group-hover:text-primary transition-fast">{course.name}</CardTitle>
                                    {course.description && ( <CardDescription className="line-clamp-2">{course.description}</CardDescription> )}
                                </CardHeader>
                                <CardContent>
                                    {/* Updated Button */}
                                    <Button size="sm" className="w-full transition-smooth pointer-events-none" disabled tabIndex={-1}>
                                        Manage Course
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="border border-gray-300 dark:border-gray-600 rounded-md"> {/* darker border */}
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        You haven't created any courses yet. Click "Create New Course" to get started!
                    </CardContent>
                </Card>
            )}
        </div>

        <hr className="border-border" /> {/* Separator */}

        {/* Quick Actions Grid (Keep this, maybe rename 'Upload Content' description) */}
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
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
                    <Button className="w-full transition-smooth" onClick={() => handleActionClick(action.action)}>
                    Get Started
                    </Button>
                </CardContent>
                </Card>
            ))}
            </div>
        </div>

        {/* Recent Activity & Analytics (Maybe update this later) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 card-elevated">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Recent Activity</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                {recentSessions.map((session) => ( <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50"> <h3>{session.title}</h3> <p className="text-xs text-muted-foreground">{session.date}</p> </div> ))}
                </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Overview</CardTitle></CardHeader>
            <CardContent className="space-y-6 text-center">
                <div><div className="text-3xl font-bold text-primary"> {courses.length} </div><p className="text-sm text-muted-foreground">Total Courses</p></div>
                <div><div className="text-3xl font-bold text-secondary">156</div><p className="text-sm text-muted-foreground">Total Students Enrolled</p></div>
                <div><div className="text-3xl font-bold text-accent">24</div><p className="text-sm text-muted-foreground">Active Lessons</p></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Keep the Upload Dialog (We'll modify it next) */}
      <UploadContentDialog
        open={isUploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        courses={courses} // Pass the fetched courses
        isLoadingCourses={isLoadingCourses} // Pass the loading state
      />
    </>
  );
};