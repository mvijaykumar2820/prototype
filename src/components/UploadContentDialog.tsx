// src/components/UploadContentDialog.tsx

import { useState } from "react";
import { UploadCloud, Video, Loader2, BookMarked, Clock } from "lucide-react"; // Added Clock
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { db, storage, auth } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CourseInfo { id: string; name: string; }

interface UploadContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: CourseInfo[];
  isLoadingCourses: boolean;
}

// Helper to format seconds into MM:SS
const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const UploadContentDialog = ({ open, onOpenChange, courses, isLoadingCourses }: UploadContentDialogProps) => {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<string | null>(null); // State for duration string
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Updated handleFileChange to get duration
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setVideoDuration(null); // Reset duration

    if (file && file.type.startsWith("video")) {
      setVideoFile(file);
      setError(null);

      // Create temporary video element to read metadata
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';

      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src); // Clean up
        const duration = videoElement.duration;
        console.log("Video duration loaded:", duration, "seconds");
        setVideoDuration(formatDuration(duration)); // Format and set state
      };

      videoElement.onerror = () => {
          console.error("Error loading video metadata.");
          window.URL.revokeObjectURL(videoElement.src); // Clean up
          setVideoDuration("Error");
      }

      videoElement.src = URL.createObjectURL(file); // Load file

    } else if (file) {
        setError("Please select a valid video file.");
        setVideoFile(null);
    } else {
        setVideoFile(null); // Clear file if selection cancelled
    }
  };

  // uploadFile function (no changes needed)
  const uploadFile = (file: File, path: string, onProgress: (progress: number) => void): Promise<string> => {
     return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on( "state_changed",
        (snapshot) => { onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100); },
        (error) => { console.error(`Upload failed:`, error); reject(error); }, // Added log
        () => { getDownloadURL(uploadTask.snapshot.ref).then(resolve); }
      );
    });
  };

  // handleUpload function (saves duration)
  const handleUpload = async () => {
    if (!selectedCourseId) { setError("Please select a course."); return; }
    if (!title.trim() || !videoFile) { setError("Please provide a lesson title and select a video file."); return; }
    if (videoDuration === null || videoDuration === "Error") {
        setError("Waiting for video duration or failed to get it. Please re-select the file.");
        return;
    }
    if (!user) { setError("You must be logged in."); return; }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
        const timestamp = Date.now();
        let videoUrl: string | null = null;

        setUploadingFile(`video: ${videoFile.name}`);
        // Use a path like lessons/[courseId]/[unique_filename]
        const filePath = `lessons/${selectedCourseId}/${timestamp}_${videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; // Sanitize filename
        videoUrl = await uploadFile(videoFile, filePath, setUploadProgress);

       setUploadingFile("Finalizing lesson...");
       setUploadProgress(100);

      // Save duration to Firestore
      await addDoc(collection(db, "sessions"), {
        title: title.trim(),
        videoUrl,
        duration: videoDuration, // Save the formatted duration string
        courseId: selectedCourseId,
        teacherId: user.uid,
        createdAt: serverTimestamp(),
      });

      console.log(`Lesson "${title}" (Duration: ${videoDuration}) added to course ${selectedCourseId}`);
      setIsUploading(false);
      onOpenChange(false); // Close dialog

    } catch (uploadError) {
        console.error("An error occurred during upload:", uploadError);
        setError("An error occurred during the upload. Please try again.");
        setIsUploading(false);
        setUploadingFile(null);
    }
  };

  // handleOnOpenChange function (resets duration)
  const handleOnOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
        setTitle("");
        setVideoFile(null);
        setVideoDuration(null); // Reset duration
        setUploadProgress(0);
        setUploadingFile(null);
        setSelectedCourseId(undefined);
        setError(null);
        setIsUploading(false);
      } else {
          setError(null); // Clear error on open
      }
      onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload New Lesson Video</DialogTitle>
          <DialogDescription>
            Add a new video lesson. Duration will be detected automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">

           {/* Course Selection Dropdown */}
           <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="course" className="text-right flex items-center gap-1 shrink-0"> <BookMarked className="h-4 w-4"/> Course </Label>
             <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={isLoadingCourses || isUploading} >
                <SelectTrigger className="col-span-3"> <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course"} /> </SelectTrigger>
                <SelectContent>
                    {isLoadingCourses ? ( <SelectItem value="loading" disabled>Loading...</SelectItem> )
                    : courses.length === 0 ? ( <SelectItem value="no-courses" disabled>No courses found. Create one first.</SelectItem> )
                    : ( courses.map((course) => ( <SelectItem key={course.id} value={course.id}> {course.name} </SelectItem> )) )}
                </SelectContent>
             </Select>
           </div>

          {/* Lesson Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right shrink-0"> Lesson Title </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., Intro to Hooks" disabled={isUploading} />
          </div>

          {/* Video Upload Section */}
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <Label htmlFor="videoFile" className="font-semibold text-sm">Lesson Video</Label>
              <Input
                id="videoFile" type="file"
                accept="video/mp4,video/webm,video/mov"
                onChange={handleFileChange}
                className="w-full" disabled={isUploading}
               />
               {/* Display filename and detected duration */}
               {videoFile && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                        <span className="truncate pr-2">{videoFile.name}</span> {/* Added truncate */}
                        {videoDuration === "Error" ? (
                             <span className="text-destructive shrink-0">Could not get duration</span>
                        ) : videoDuration ? (
                            <span className="flex items-center gap-1 shrink-0"><Clock className="h-3 w-3"/> {videoDuration}</span>
                        ) : (
                            <span className="flex items-center gap-1 shrink-0"><Loader2 className="h-3 w-3 animate-spin"/> Getting duration...</span>
                        )}
                    </div>
               )}
          </div>

          {/* Progress and Error display */}
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
             type="submit" onClick={handleUpload}
             // Disable if loading, no course, no video, OR duration not loaded/error
             disabled={isUploading || isLoadingCourses || courses.length === 0 || !selectedCourseId || !videoFile || !videoDuration || videoDuration === "Error"}
           >
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing Lesson...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Publish Lesson</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};