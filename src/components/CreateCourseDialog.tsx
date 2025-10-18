import { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger // Import DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { db, auth } from "@/lib/firebase"; // Import db and auth
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

// Optional: Add a prop if you need to refresh the course list after creation
interface CreateCourseDialogProps {
    onCourseCreated?: () => void;
}

export const CreateCourseDialog = ({ onCourseCreated }: CreateCourseDialogProps) => {
  const [user] = useAuthState(auth); // Get current teacher
  const [open, setOpen] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCourse = async () => {
    if (!courseName.trim() || !user) {
      setError("Please enter a course name.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add course to Firestore 'courses' collection
      await addDoc(collection(db, "courses"), {
        name: courseName.trim(),
        description: courseDescription.trim(),
        teacherId: user.uid, // Link course to the current teacher
        teacherName: user.displayName || user.email, // Store teacher's name/email
        createdAt: serverTimestamp(),
      });

      console.log("Course created:", courseName);
      setIsLoading(false);
      setOpen(false); // Close the dialog
      setCourseName(""); // Reset fields
      setCourseDescription("");
      console.log("Attempting to call onCourseCreated callback...");
      onCourseCreated?.(); // Call the callback to refresh list if provided

    } catch (err) {
      console.error("Error creating course:", err);
      setError("Failed to create course. Please try again.");
      setIsLoading(false);
    }
  };

  // Reset state when dialog is closed/opened
  const handleOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
          setCourseName("");
          setCourseDescription("");
          setError(null);
          setIsLoading(false);
      }
      setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Enter the details for your new course. You can add lessons later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="courseName" className="text-right">
              Name
            </Label>
            <Input
              id="courseName"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., React Fundamentals"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4"> {/* Changed items-center to items-start for textarea */}
            <Label htmlFor="courseDescription" className="text-right pt-2"> {/* Added padding-top */}
              Description
            </Label>
            <Textarea
              id="courseDescription"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              className="col-span-3 min-h-[80px]" // Added min-height
              placeholder="Briefly describe what this course is about (optional)"
              disabled={isLoading}
            />
          </div>
           {error && (
            <p className="col-start-1 col-span-4 text-sm text-center text-destructive">{error}</p>
           )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleCreateCourse} disabled={isLoading}>
            {isLoading ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating... </>
            ) : (
                "Create Course"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};