// src/components/UploadContentDialog.tsx

import { useState } from "react";
// Removed Select components if not needed elsewhere in this file
import { UploadCloud, Video, Loader2, BookMarked } from "lucide-react"; // Removed FileText, Mic
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { db, storage, auth } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Keep Select for course selection

// Define Course structure locally for prop typing
interface CourseInfo {
    id: string;
    name: string;
}

interface UploadContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: CourseInfo[];
  isLoadingCourses: boolean;
}

// --- REMOVED FileType type ---

export const UploadContentDialog = ({ open, onOpenChange, courses, isLoadingCourses }: UploadContentDialogProps) => {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState("");
  // --- Only videoFile state needed ---
  const [videoFile, setVideoFile] = useState<File | null>(null);
  // --- REMOVED slidesFile, audioFile states ---
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null); // Keep for progress message
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Simplified handleFileChange ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setError(null); // Clear error when a file is selected
    }
  };

  const uploadFile = (file: File, path: string, onProgress: (progress: number) => void): Promise<string> => {
     return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on( "state_changed", (snapshot) => { onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100); }, reject, () => { getDownloadURL(uploadTask.snapshot.ref).then(resolve); });
    });
  };

  const handleUpload = async () => {
    // --- Updated validation ---
    if (!selectedCourseId) { setError("Please select a course."); return; }
    if (!title.trim() || !videoFile) { setError("Please provide a lesson title and select a video file."); return; }
    if (!user) { setError("You must be logged in."); return; }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
        const timestamp = Date.now();
        let videoUrl: string | null = null;

        // --- Only upload videoFile ---
        setUploadingFile(`video: ${videoFile.name}`);
        videoUrl = await uploadFile(videoFile, `lessons/${selectedCourseId}/${timestamp}_${videoFile.name}`, setUploadProgress); // Changed path slightly

       setUploadingFile("Finalizing lesson...");
       setUploadProgress(100);

      // --- Updated: Save session metadata with only videoUrl ---
      await addDoc(collection(db, "sessions"), { // Still using "sessions" collection, maybe rename later if desired
        title: title.trim(),
        videoUrl, // Only save video URL
        // REMOVED slidesUrl, audioUrl
        courseId: selectedCourseId,
        teacherId: user.uid,
        createdAt: serverTimestamp(),
      });

      console.log(`Lesson "${title}" added to course ${selectedCourseId}`);
      setIsUploading(false);
      onOpenChange(false); // Close dialog on success

    } catch (uploadError) {
      console.error("An error occurred during upload:", uploadError);
      setError("An error occurred during the upload. Please try again.");
      setIsUploading(false);
      setUploadingFile(null);
    }
  };

  // --- Updated reset ---
  const handleOnOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
        setTitle("");
        setVideoFile(null); // Only reset video file
        setUploadProgress(0);
        setUploadingFile(null);
        setSelectedCourseId(undefined);
        setError(null);
        setIsUploading(false);
      } else {
          setError(null); // Reset error when opening
      }
      onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          {/* --- Updated Titles --- */}
          <DialogTitle>Upload New Lesson Video</DialogTitle>
          <DialogDescription>
            Add a new video lesson to one of your courses. Compress video beforehand for best results.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">

           {/* Course Selection Dropdown (No changes) */}
           <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="course" className="text-right flex items-center gap-1 shrink-0">
               <BookMarked className="h-4 w-4"/> Course
             </Label>
             <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={isLoadingCourses || isUploading} >
                <SelectTrigger className="col-span-3"> <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course"} /> </SelectTrigger>
                <SelectContent>
                    {isLoadingCourses ? ( <SelectItem value="loading" disabled>Loading...</SelectItem> )
                    : courses.length === 0 ? ( <SelectItem value="no-courses" disabled>No courses found.</SelectItem> )
                    : ( courses.map((course) => ( <SelectItem key={course.id} value={course.id}> {course.name} </SelectItem> )) )}
                </SelectContent>
             </Select>
           </div>

          {/* Lesson Title (No changes) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right shrink-0"> Lesson Title </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., Introduction to React Hooks" disabled={isUploading} />
          </div>

          {/* --- SIMPLIFIED: Video Upload Section --- */}
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <Label htmlFor="videoFile" className="font-semibold text-sm">Lesson Video</Label>
              <Input
                id="videoFile"
                type="file"
                accept="video/mp4,video/webm" // Recommend specific web formats
                onChange={handleFileChange}
                className="w-full" // Make full width
                disabled={isUploading}
               />
               {videoFile && <p className="text-xs text-muted-foreground pt-1">{videoFile.name}</p>}
          </div>

          {/* --- REMOVED Low-Bandwidth Section --- */}

          {/* Progress and Error display (No changes needed) */}
          {isUploading && (
            <div className="col-span-4 space-y-2">
                <Progress value={uploadProgress} className="w-full h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {uploadingFile ? `Uploading ${uploadingFile}... ` : 'Preparing upload...'}
                  ({Math.round(uploadProgress)}%)
                </p>
            </div>
          )}
          {error && (
            <p className="col-span-4 text-sm text-center text-destructive">{error}</p>
          )}

        </div>
        <DialogFooter>
          <Button
             type="submit"
             onClick={handleUpload}
             disabled={isUploading || isLoadingCourses || courses.length === 0 || !selectedCourseId || !videoFile} // Disable if no video selected
           >
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing Lesson...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Publish Lesson</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};