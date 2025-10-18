// src/components/StudentDashboard.tsx

import { useState, useEffect } from "react";
import { Play, BookOpen, Brain, Clock, Signal, Wifi, WifiOff, Download, Search, BookCopy, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where, Timestamp,
         doc, setDoc, getDoc, arrayUnion } from "firebase/firestore";
import { useNetworkState } from "@/hooks/useNetworkState";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link } from 'react-router-dom';

// Interfaces
interface Course {
    id: string;
    name: string;
    description?: string;
    teacherName?: string;
    teacherId: string;
    createdAt: Timestamp;
}

interface Enrollment {
    courseId: string;
    courseName: string;
    enrolledAt: Timestamp;
}

export const StudentDashboard = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]); // Initialized as array
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const networkStatus = useNetworkState();

  // --- Fetch student's enrollments (No changes) ---
  const fetchEnrollments = async () => {
      if (!user) return;
      setIsLoadingEnrollments(true);
      try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data()?.enrollments) {
              const enrollmentsData = (userSnap.data()?.enrollments as Enrollment[]).sort(
                (a, b) => b.enrolledAt.toMillis() - a.enrolledAt.toMillis() // Newest first
              );
              setEnrolledCourses(enrollmentsData); // Sets an array
          } else {
              setEnrolledCourses([]); // Sets an empty array
          }
      } catch (error) { console.error("Error fetching enrollments:", error); setEnrolledCourses([]); } // Sets empty array on error
      finally { setIsLoadingEnrollments(false); }
  };

  // Fetch enrollments when user loads
  useEffect(() => {
    if (user && !loadingAuth) {
      fetchEnrollments();
    } else if (!loadingAuth && !user) {
        setIsLoadingEnrollments(false);
        setEnrolledCourses([]);
    }
  }, [user, loadingAuth]);

  // --- Handle Search (No changes) ---
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim() || term.trim().length < 3) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    try {
        const coursesRef = collection(db, "courses");
        const searchTermLower = term.toLowerCase();
        const q = query( coursesRef, where("name", ">=", searchTermLower), where("name", "<=", searchTermLower + '\uf8ff'), orderBy("name") );
        const querySnapshot = await getDocs(q);
        const resultsMap = new Map<string, Course>();
        querySnapshot.docs.forEach(doc => {
            const courseNameLower = (doc.data().name as string).toLowerCase();
            if (courseNameLower.startsWith(searchTermLower)) { resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as Course) }
        });
        const enrolledIds = new Set(enrolledCourses.map(e => e.courseId));
        const finalResults = Array.from(resultsMap.values()).filter(course => !enrolledIds.has(course.id));
        setSearchResults(finalResults);
    } catch (error) { console.error("Error searching courses:", error); setSearchResults([]); }
    finally { setIsSearching(false); }
  };

   // --- Handle Enrollment (No changes) ---
   const handleEnroll = async (course: Course) => {
       if (!user) return;
       console.log(`Enrolling in course: ${course.name} (${course.id})`);
       try {
           const userRef = doc(db, "users", user.uid);
           const newEnrollment: Enrollment = { courseId: course.id, courseName: course.name, enrolledAt: Timestamp.now() };
           await setDoc(userRef, { enrollments: arrayUnion(newEnrollment) }, { merge: true });
           console.log("Enrollment successful!");
           await fetchEnrollments(); // Refresh enrollments
           setSearchTerm(""); setSearchResults([]); // Clear search
       } catch (error) { console.error("Error enrolling in course:", error); alert("Failed to enroll. Please try again."); }
   };

   const upcomingTests = [ { id: 1, title: "React Quiz", dueDate: "Tomorrow", questions: 15 }, { id: 2, title: "JS Assessment", dueDate: "In 3 days", questions: 20 } ]; // Keep dummy data

   // --- Helper function to render enrolled courses ---
   const renderEnrolledCourses = () => {
       if (isLoadingEnrollments) {
           return (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {Array.from({ length: 3 }).map((_, i) => ( <Card key={i}><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-8 w-full mt-3" /></CardContent></Card> ))}
               </div>
           );
       }
       // Check if array AND has items AFTER loading check
       if (Array.isArray(enrolledCourses) && enrolledCourses.length > 0) {
           return (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {enrolledCourses.map((enrollment) => (
                       <Link key={enrollment.courseId} to={`/course/${enrollment.courseId}`} className="no-underline">
                           <Card className="card-interactive group h-full border border-gray-300 dark:border-gray-600 rounded-md"> {/* darker border */}
                               <CardHeader>
                                   <CardTitle className="text-lg group-hover:text-primary transition-fast">{enrollment.courseName}</CardTitle>
                                   <CardDescription>Click to view lessons</CardDescription>
                               </CardHeader>
                               <CardContent>
                                   <Button className="w-full bg-primary text-white hover:bg-primary/90 transition-smooth" tabIndex={0}>
                                     View Lessons
                                   </Button>
                               </CardContent>
                           </Card>
                       </Link>
                   ))}
               </div>
           );
       }
       // If not loading and array is empty
       return <Card className="border border-gray-300 dark:border-gray-600 rounded-md"> <CardContent className="pt-6 text-center text-muted-foreground">You haven't enrolled in any courses yet. Use the search bar above!</CardContent> </Card>;
   };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
            <p className="text-muted-foreground">Your enrolled courses and learning progress</p>
          </div>
          {/* Network Status */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
             {networkStatus === "good" || networkStatus === 'moderate' ? ( <><Wifi className="h-4 w-4 text-success" /> <span className="text-sm text-success">High Speed</span></> )
             : ( <><WifiOff className="h-4 w-4 text-warning" /> <span className="text-sm text-warning">Low Bandwidth</span></> )}
           </div>
      </div>

      {/* Course Search Section */}
      <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"> <Search className="h-5 w-5"/> Find New Courses </h2>
          <div className="relative">
              <Input type="search" placeholder="Search for courses..." value={searchTerm} onChange={(e) => handleSearch(e.target.value)} className="pl-10"/>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          {/* Search Results Display */}
          {isSearching && ( <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground"/></div> )}
          {!isSearching && searchTerm.length >= 3 && searchResults.length === 0 && ( <p className="text-center text-muted-foreground py-4">No courses found matching "{searchTerm}".</p> )}
          {!isSearching && searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {searchResults.map((course) => (
                      <Card key={course.id} className="card-elevated border border-gray-300 dark:border-gray-600 rounded-md"> {/* darker border */}
                          <CardHeader>
                              <CardTitle>{course.name}</CardTitle>
                              <CardDescription className="line-clamp-2">
                                  {course.description || 'No description available.'} <br/>
                                  <span className="text-xs">Taught by: {course.teacherName || 'Unknown'}</span>
                              </CardDescription>
                          </CardHeader>
                          <CardContent>
                              <Button className="w-full" onClick={() => handleEnroll(course)}> <PlusCircle className="mr-2 h-4 w-4"/> Enroll Now </Button>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          )}
      </div>

       <hr className="border-border" />

      {/* Enrolled Courses Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"> <BookCopy className="h-5 w-5"/> My Courses </h2>
        {/* Call the helper function to render content */}
        {renderEnrolledCourses()}
      </div>

      {/* Upcoming Tests & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Upcoming Tests Card */}
         <Card className="lg:col-span-2 card-elevated">
           <CardHeader><CardTitle className="flex items-center gap-2"><Signal className="h-5 w-5" />Upcoming Tests</CardTitle><CardDescription>Stay on track with assessments</CardDescription></CardHeader>
           <CardContent><div className="space-y-4">{upcomingTests.map((test) => ( <div key={test.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50"> <div><h3 className="font-medium">{test.title}</h3><p className="text-sm text-muted-foreground">{test.questions} questions</p></div> <div className="text-right"><p className="text-sm font-medium">{test.dueDate}</p><Button size="sm" className="mt-2" disabled>Take Test</Button></div> </div> ))}</div></CardContent>
         </Card>
         {/* Your Progress Card */}
         <Card className="card-elevated">
           <CardHeader><CardTitle>Your Progress</CardTitle></CardHeader>
           <CardContent className="space-y-6">
                {/* Dynamically show enrolled courses count */}
               <div className="text-center"><div className="text-3xl font-bold text-primary">{isLoadingEnrollments ? <Skeleton className="h-8 w-12 mx-auto"/> : enrolledCourses.length}</div><p className="text-sm text-muted-foreground">Courses Enrolled</p></div>
               {/* Dummy data for other stats */}
               <div className="text-center"><div className="text-3xl font-bold text-secondary">67%</div><p className="text-sm text-muted-foreground">Overall Completion</p></div>
               <div className="text-center"><div className="text-3xl font-bold text-accent">4.8</div><p className="text-sm text-muted-foreground">Average Score</p></div>
           </CardContent>
         </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;