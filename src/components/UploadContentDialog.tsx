// src/components/UploadContentDialog.tsx

import { useState } from "react";
// --- Added Select imports ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, Video, FileText, Mic, Loader2, BookMarked } from "lucide-react"; // Added BookMarked
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Removed DialogTrigger
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { db, storage, auth } from "@/lib/firebase"; // Import auth
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
// --- Added more Firestore imports ---
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Removed unused imports
import { useAuthState } from "react-firebase-hooks/auth"; // Import useAuthState

// Define Course structure locally for prop typing
interface CourseInfo {
    id: string;
    name: string;
}

interface UploadContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // --- Receive courses and loading state as props ---
  courses: CourseInfo[];
  isLoadingCourses: boolean;
}

type FileType = 'video' | 'slides' | 'audio';

// --- Updated props ---
export const UploadContentDialog = ({ open, onOpenChange, courses, isLoadingCourses }: UploadContentDialogProps) => {
  const [user] = useAuthState(auth); // Get current user
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [slidesFile, setSlidesFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  // --- State for selected course ---
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: FileType) => {
    const file = e.target.files?.[0];
    if (file) {
      switch (type) {
        case 'video': setVideoFile(file); break;
        case 'slides': setSlidesFile(file); break;
        case 'audio': setAudioFile(file); break;
      }
      setError(null); // Clear error when a file is selected
    }
  };

  const uploadFile = (file: File, path: string, onProgress: (progress: number) => void): Promise<string> => {
     return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => { console.error(`Upload failed for ${file.name}:`, error); reject(error); },
        () => { getDownloadURL(uploadTask.snapshot.ref).then(resolve); }
      );
    });
  };

  const handleUpload = async () => {
    // --- Check course selection first ---
    if (!selectedCourseId) {
        setError("Please select a course for this lesson.");
        return;
    }
    if (!title.trim() || (!videoFile && (!slidesFile || !audioFile))) {
      setError("Please provide a lesson title and either a video, or both slides and audio.");
      return;
    }
    if (!user) {
        setError("You must be logged in to upload content.");
        setIsUploading(false); // Make sure uploading stops if user somehow isn't available
        return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
        const timestamp = Date.now();
        let videoUrl: string | null = null;
        let slidesUrl: string | null = null;
        let audioUrl: string | null = null;

        // --- Upload files sequentially with progress updates ---
        if (videoFile) {
            setUploadingFile(`video: ${videoFile.name}`);
            videoUrl = await uploadFile(videoFile, `sessions/${timestamp}_${videoFile.name}`, setUploadProgress);
        }
        if (slidesFile) {
            setUploadingFile(`slides: ${slidesFile.name}`);
            slidesUrl = await uploadFile(slidesFile, `sessions/${timestamp}_${slidesFile.name}`, setUploadProgress);
        }
        if (audioFile) {
            setUploadingFile(`audio: ${audioFile.name}`);
            audioUrl = await uploadFile(audioFile, `sessions/${timestamp}_${audioFile.name}`, setUploadProgress);
        }

       setUploadingFile("Finalizing lesson...");
       setUploadProgress(100); // Show 100% while saving to DB

      // --- Save session metadata to Firestore, including courseId ---
      await addDoc(collection(db, "sessions"), {
        title: title.trim(), // Trim title
        videoUrl,
        slidesUrl,
        audioUrl,
        courseId: selectedCourseId, // Add the selected course ID
        teacherId: user.uid, // Add the teacher's ID
        createdAt: serverTimestamp(),
      });

      console.log(`Lesson "${title}" added to course ${selectedCourseId}`);
      setIsUploading(false);
      onOpenChange(false); // Close dialog on success

    } catch (uploadError) {
      console.error("An error occurred during upload:", uploadError);
      setError("An error occurred during the upload. Please try again.");
      setIsUploading(false); // Ensure loading stops on error
      setUploadingFile(null); // Clear uploading file message
    }
  };

  // Reset state when dialog is closed/opened
  const handleOnOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
        // Reset all fields when closing
        setTitle("");
        setVideoFile(null);
        setSlidesFile(null);
        setAudioFile(null);
        setUploadProgress(0);
        setUploadingFile(null);
        setSelectedCourseId(undefined); // Reset selected course
        setError(null);
        setIsUploading(false);
      } else {
          // Reset error when opening
          setError(null);
      }
      onOpenChange(isOpen);
  }

  return (
    // Dialog open state is controlled by TeacherDashboard
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload New Lesson Content</DialogTitle>
          <DialogDescription>
            Add a new lesson to one of your courses. Include content for high and low bandwidth users.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">

           {/* --- Course Selection Dropdown --- */}
           <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="course" className="text-right flex items-center gap-1 shrink-0"> {/* Ensure label doesn't wrap */}
               <BookMarked className="h-4 w-4"/> Course
             </Label>
             <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
                disabled={isLoadingCourses || isUploading} // Disable during upload too
             >
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course"} />
                </SelectTrigger>
                <SelectContent>
                    {isLoadingCourses ? (
                         <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : courses.length === 0 ? (
                         <SelectItem value="no-courses" disabled>No courses found. Create one first.</SelectItem>
                    ) : (
                        // Map through the courses passed as props
                        courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                                {course.name}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
             </Select>
           </div>

          {/* Lesson Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right shrink-0">
              Lesson Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., Introduction to React Hooks" disabled={isUploading} />
          </div>

          {/* High-Bandwidth Content */}
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <Label className="font-semibold text-sm">High-Bandwidth (Video)</Label>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="videoFile" className="text-right text-sm sr-only"> Video </Label> {/* Hide redundant label */}
                    <Input id="videoFile" type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} className="col-span-4" disabled={isUploading} /> {/* Make full width */}
                </div>
                {videoFile && <p className="text-xs text-muted-foreground pt-1">{videoFile.name}</p>}
          </div>

          {/* Low-Bandwidth Content */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <Label className="font-semibold text-sm">Low-Bandwidth (Slides + Audio)</Label>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slidesFile" className="text-right text-sm sr-only"> Slides </Label>
                <Input id="slidesFile" type="file" accept=".pdf,application/pdf" onChange={(e) => handleFileChange(e, 'slides')} className="col-span-4" disabled={isUploading} />
            </div>
             {slidesFile && <p className="text-xs text-muted-foreground pt-1">{slidesFile.name}</p>}
             <div className="grid grid-cols-4 items-center gap-4 mt-2"> {/* Added margin top */}
                <Label htmlFor="audioFile" className="text-right text-sm sr-only"> Audio </Label>
                <Input id="audioFile" type="file" accept="audio/*" onChange={(e) => handleFileChange(e, 'audio')} className="col-span-4" disabled={isUploading} />
            </div>
            {audioFile && <p className="text-xs text-muted-foreground pt-1">{audioFile.name}</p>}
          </div>

          {/* Progress and Error display */}
          {isUploading && (
            <div className="col-span-4 space-y-2">
                <Progress value={uploadProgress} className="w-full h-2" /> {/* Made progress bar thinner */}
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
             // Disable button if loading, uploading, or no course selected/available
             disabled={isUploading || isLoadingCourses || courses.length === 0 || !selectedCourseId}
           >
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing Lesson...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Publish Lesson</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};