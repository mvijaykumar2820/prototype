import { useState } from "react";
import { UploadCloud, Video, FileText, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface UploadContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FileType = 'video' | 'slides' | 'audio';

export const UploadContentDialog = ({ open, onOpenChange }: UploadContentDialogProps) => {
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [slidesFile, setSlidesFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null); // To show which file is uploading
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
      setError(null);
    }
  };

  // --- NEW --- This function now takes a progress callback
  const uploadFile = (file: File, path: string, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress); // Update progress in real-time
        },
        (error) => {
          console.error(`Upload failed for ${file.name}:`, error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(resolve);
        }
      );
    });
  }

  const handleUpload = async () => {
    if (!title.trim() || (!videoFile && (!slidesFile || !audioFile))) {
      setError("Please provide a title and either a video, or both slides and audio.");
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
      
      setUploadingFile("Finalizing session...");
      setUploadProgress(100);

      // Save session metadata to Firestore
      await addDoc(collection(db, "sessions"), {
        title,
        videoUrl,
        slidesUrl,
        audioUrl,
        createdAt: serverTimestamp(),
        teacherId: "dummy-teacher-id", 
      });

      setIsUploading(false);
      onOpenChange(false);
      // You can add a success toast here
    } catch (uploadError) {
      console.error("An error occurred during upload:", uploadError);
      setError("An error occurred during the upload. Please try again.");
      setIsUploading(false);
    }
  };
  
  const handleOnOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
        setTitle("");
        setVideoFile(null);
        setSlidesFile(null);
        setAudioFile(null);
        setUploadProgress(0);
        setUploadingFile(null);
        setError(null);
        setIsUploading(false);
      }
      onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload New Content</DialogTitle>
          <DialogDescription>
            Create a session by uploading a video for high-bandwidth users, and slides/audio for low-bandwidth users.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., Introduction to React" disabled={isUploading} />
          </div>
          
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <Label className="font-semibold">High-Bandwidth Content</Label>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="videoFile" className="text-right text-sm">
                    Video
                </Label>
                <Input id="videoFile" type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} className="col-span-3" disabled={isUploading} />
            </div>
             {videoFile && <p className="text-xs text-muted-foreground col-start-2 col-span-3 pl-2">{videoFile.name}</p>}
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <Label className="font-semibold">Low-Bandwidth Content</Label>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slidesFile" className="text-right text-sm">
                    Slides
                </Label>
                <Input id="slidesFile" type="file" accept=".pdf,application/pdf" onChange={(e) => handleFileChange(e, 'slides')} className="col-span-3" disabled={isUploading} />
            </div>
             {slidesFile && <p className="text-xs text-muted-foreground col-start-2 col-span-3 pl-2">{slidesFile.name}</p>}
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="audioFile" className="text-right text-sm">
                    Audio
                </Label>
                <Input id="audioFile" type="file" accept="audio/*" onChange={(e) => handleFileChange(e, 'audio')} className="col-span-3" disabled={isUploading} />
            </div>
            {audioFile && <p className="text-xs text-muted-foreground col-start-2 col-span-3 pl-2">{audioFile.name}</p>}
          </div>

          {isUploading && (
            <div className="col-span-4 space-y-2">
                <Progress value={uploadProgress} className="w-full" />
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
          <Button type="submit" onClick={handleUpload} disabled={isUploading}>
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Publish Session</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

