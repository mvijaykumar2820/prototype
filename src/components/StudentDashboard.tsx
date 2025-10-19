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
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const networkStatus = useNetworkState();

  // --- Fetch and VERIFY enrollments ---
  const fetchEnrollments = async () => {
      if (!user) return;
      setIsLoadingEnrollments(true);
      try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists() && userSnap.data()?.enrollments) {
              const enrollmentsFromDB = userSnap.data()?.enrollments as Enrollment[];
              const courseChecks = enrollmentsFromDB.map(e => getDoc(doc(db, "courses", e.courseId)));
              const courseDocs = await Promise.all(courseChecks);
              const verifiedEnrollments = enrollmentsFromDB.filter((e, i) => courseDocs[i].exists());
              if (verifiedEnrollments.length !== enrollmentsFromDB.length) {
                  console.warn("Some enrolled courses were not found and have been filtered.");
                  // Optionally update the user's enrollment array in Firestore here to clean it up
              }
              const sortedEnrollments = verifiedEnrollments.sort((a, b) => b.enrolledAt.toMillis() - a.enrolledAt.toMillis());
              setEnrolledCourses(sortedEnrollments);
          } else { setEnrolledCourses([]); }
      } catch (error) { console.error("Error fetching/verifying enrollments:", error); setEnrolledCourses([]); }
      finally { setIsLoadingEnrollments(false); }
  };

  // Fetch enrollments when user loads
  useEffect(() => {
    if (user && !loadingAuth) { fetchEnrollments(); }
    else if (!loadingAuth && !user) { setIsLoadingEnrollments(false); setEnrolledCourses([]); }
  }, [user, loadingAuth]);

  // --- FIXED: Handle Search ---
  const handleSearch = async (term: string) => {
    // Update the state immediately so the input reflects typing
    setSearchTerm(term);

    // Only perform search if term is long enough
    if (!term.trim() || term.trim().length < 3) {
        setSearchResults([]); // Clear results if search term is too short
        setIsSearching(false); // Ensure loading stops
        return;
    }

    setIsSearching(true); // Start loading indicator
    setSearchResults([]); // Clear previous results immediately

    try {
        const coursesRef = collection(db, "courses");
        const searchTermLower = term.toLowerCase();

        // Basic Firestore prefix search (case-sensitive index limitation)
        // Query for lowercase start
        const qLower = query(
            coursesRef,
            where("name", ">=", searchTermLower),
            where("name", "<=", searchTermLower + '\uf8ff'),
             orderBy("name")
        );
         // Query for uppercase start (handle potential capitalization)
         const qUpper = query(
            coursesRef,
            where("name", ">=", term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()), // Proper capitalization
            where("name", "<=", term.charAt(0).toUpperCase() + term.slice(1).toLowerCase() + '\uf8ff'),
             orderBy("name")
        );

        // Fetch results from both queries
        const [querySnapshotLower, querySnapshotUpper] = await Promise.all([
            getDocs(qLower),
            getDocs(qUpper)
        ]);


        // Combine results and remove duplicates
        const resultsMap = new Map<string, Course>();
        const processSnapshot = (snapshot: typeof querySnapshotLower) => {
             snapshot.docs.forEach(doc => {
                 // **Client-side filtering for exact prefix match (case-insensitive)**
                 const courseNameLower = (doc.data().name as string).toLowerCase();
                 if (courseNameLower.startsWith(searchTermLower)) {
                      resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as Course);
                 }
             });
        };

        processSnapshot(querySnapshotLower);
        processSnapshot(querySnapshotUpper);


        // Filter out courses already enrolled in
        const enrolledIds = new Set(enrolledCourses.map(e => e.courseId));
        const finalResults = Array.from(resultsMap.values()).filter(course => !enrolledIds.has(course.id));

        setSearchResults(finalResults);
        console.log("Search results:", finalResults);

    } catch (error) {
        console.error("Error searching courses:", error);
        setSearchResults([]); // Clear results on error
    } finally {
        setIsSearching(false); // Stop loading indicator
    }
  };

   // Handle Enrollment (No changes)
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

   const upcomingTests = [ { id: 1, title: "React Quiz", dueDate: "Tomorrow", questions: 15 }, { id: 2, title: "JS Assessment", dueDate: "In 3 days", questions: 20 } ];

   // Helper function to render enrolled courses
   const renderEnrolledCourses = (): JSX.Element | null => {
     if (isLoadingEnrollments) {
       return (
         <div className="py-8">
           <Skeleton className="h-5 w-48 mb-4" />
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {[1, 2, 3].map((n) => (
               <Card key={n} className="card-elevated">
                 <CardHeader>
                   <CardTitle><Skeleton className="h-4 w-32" /></CardTitle>
                   <CardDescription className="line-clamp-2"><Skeleton className="h-3 w-full" /></CardDescription>
                 </CardHeader>
                 <CardContent>
                   <Skeleton className="h-8 w-full" />
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       );
     }

     if (!isLoadingEnrollments && enrolledCourses.length === 0) {
       return <p className="text-center text-muted-foreground py-8">You are not enrolled in any courses yet.</p>;
     }

     return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {enrolledCourses.map((enrollment) => (
           <Link 
             key={enrollment.courseId} 
             to={`/course/${enrollment.courseId}`} // Changed from /courses/ to /course/
             className="no-underline" // Prevent default link styling
           >
             <Card className="card-elevated hover:bg-accent/5 transition-colors">
               <CardHeader>
                 <CardTitle>{enrollment.courseName}</CardTitle>
                 <CardDescription className="text-xs">
                   Enrolled: {enrollment.enrolledAt.toDate().toLocaleDateString()}
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 {/* Remove the nested Link, use a styled div instead */}
                 <div className="text-primary">View Course</div>
               </CardContent>
             </Card>
           </Link>
         ))}
       </div>
     );
   };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header with border */}
      <div className="flex justify-between items-start p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
            <p className="text-muted-foreground">Your enrolled courses and learning progress</p>
          </div>
          {/* Network Status */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-muted/50">
             {networkStatus === "good" || networkStatus === 'moderate' ? (
               <><Wifi className="h-4 w-4 text-success" /> <span className="text-sm text-success">High Speed</span></>
             ) : (
               <><WifiOff className="h-4 w-4 text-warning" /> <span className="text-sm text-warning">Low Bandwidth</span></>
             )}
           </div>
      </div>

      {/* Course Search Section with border */}
      <div className="space-y-4 p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Search className="h-5 w-5"/> Find New Courses
          </h2>
          <div className="relative">
              <Input
                type="search"
                placeholder="Search for courses (min 3 chars)..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border border-gray-300 dark:border-gray-600"
               />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          {/* Search Results with borders */}
          {isSearching && (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground"/>
            </div>
          )}
          {!isSearching && searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {searchResults.map((course) => (
                      <Card key={course.id} className="border border-gray-300 dark:border-gray-600 hover:bg-accent/5 transition-colors">
                          <CardHeader>
                              <CardTitle>{course.name}</CardTitle>
                              <CardDescription className="line-clamp-2">
                                  {course.description || 'No description available.'} <br/>
                                  <span className="text-xs">Taught by: {course.teacherName || 'Unknown'}</span>
                              </CardDescription>
                          </CardHeader>
                          <CardContent>
                              <Button className="w-full bg-primary text-white hover:bg-primary/90" onClick={() => handleEnroll(course)}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Enroll Now
                              </Button>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          )}
      </div>

      {/* Enrolled Courses Section */}
      <div className="space-y-4 p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-background/50">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <BookCopy className="h-5 w-5"/> My Courses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolledCourses.map((enrollment) => (
            <Link key={enrollment.courseId} to={`/course/${enrollment.courseId}`} className="no-underline">
              <Card className="border border-gray-300 dark:border-gray-600 hover:bg-accent/5 transition-colors">
                <CardHeader>
                  <CardTitle>{enrollment.courseName}</CardTitle>
                  <CardDescription className="text-xs">
                    Enrolled: {enrollment.enrolledAt.toDate().toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-primary text-white hover:bg-primary/90">
                    Open Course
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Tests & Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Upcoming Tests Card */}
         <Card className="lg:col-span-2 border border-gray-300 dark:border-gray-600">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Signal className="h-5 w-5" />Upcoming Tests
             </CardTitle>
             <CardDescription>Stay on track with assessments</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               {upcomingTests.map((test) => (
                 <div key={test.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-muted/50">
                   <div>
                     <h3 className="font-medium">{test.title}</h3>
                     <p className="text-sm text-muted-foreground">{test.questions} questions</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-medium">{test.dueDate}</p>
                     <Button size="sm" className="mt-2 bg-primary text-white hover:bg-primary/90" disabled>
                       Take Test
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
         {/* Your Progress Card */}
         <Card className="border border-gray-300 dark:border-gray-600">
           <CardHeader>
             <CardTitle>Your Progress</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="text-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
               <div className="text-3xl font-bold text-primary">
                 {isLoadingEnrollments ? <Skeleton className="h-8 w-12 mx-auto"/> : enrolledCourses.length}
               </div>
               <p className="text-sm text-muted-foreground">Courses Enrolled</p>
             </div>
             <div className="text-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
               <div className="text-3xl font-bold text-secondary">67%</div>
               <p className="text-sm text-muted-foreground">Overall Completion</p>
             </div>
             <div className="text-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
               <div className="text-3xl font-bold text-accent">4.8</div>
               <p className="text-sm text-muted-foreground">Average Score</p>
             </div>
           </CardContent>
         </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;