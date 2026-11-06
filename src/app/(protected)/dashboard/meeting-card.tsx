"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadFile } from "@/firebase";
import { Presentation, Upload } from "lucide-react";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { api } from "@/trpc/react";
import useProjects from "@/hooks/use-project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
type ProcessMeetingResponse = { success?: boolean; error?: string };
const MeetingCard = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const project = useProjects();
  const processMeeting = useMutation({
    mutationFn: async (data: {
      projectId: string;
      meetingUrl: string;
      meetingId: string;
    }) => {
      const { meetingUrl, projectId, meetingId } = data;
      const response = await axios.post<ProcessMeetingResponse>(
        "/api/process-meeting",
        {
          meetingUrl,
          projectId,
          meetingId,
        },
      );
      if (!response.data.success) {
        throw new Error(response.data.error ?? "Failed to process meeting");
      }
      return response.data;
    },
  });
  const uploadMeeting = api.project.uploadMeeting.useMutation();

  const router = useRouter();
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".aac", ".m4a"],
    },
    multiple: false,
    maxSize: 1024 * 1024 * 50,
    onDrop: (acceptedFiles) => {
      // 1. Create a separate async function block inside the synchronous callback
      const handleDrop = async () => {
        if (!project) return;
        const file = acceptedFiles[0];
        if (!file) return;
        setIsUploading(true);
        const downloadUrl = (await uploadFile(
          file as File,
          setProgress,
        )) as string;
        uploadMeeting.mutate(
          {
            projectId: project.projectId,
            meetingUrl: downloadUrl,
            name: file.name,
          },
          {
            onSuccess: (meeting) => {
              toast.success("Meeting uploaded successfully");
              router.push("/meetings");
              processMeeting
                .mutateAsync({
                  projectId: meeting.projectId,
                  meetingUrl: meeting.meetingUrl,
                  meetingId: meeting.id,
                })
                .then(() => {
                  toast.success("Meeting processed successfully");
                })
                .catch(() => {
                  toast.error("Failed to process meeting");
                });
            },
            onError: () => {
              toast.error("Failed to upload meeting");
            },
          },
        );
        setIsUploading(false);
        console.log("Upload Complete! URL:", downloadUrl);
      };
      void handleDrop();
    },
  });

  return (
    <Card className="border-border/70 h-full gap-0 py-0 shadow-sm lg:col-span-2">
      {!isUploading && (
        <div
          {...getRootProps()}
          className="hover:bg-primary/5 flex h-full min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl px-6 py-8 text-center transition-colors"
        >
          <input {...getInputProps()} />
          <div className="bg-primary/10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
            <Presentation className="text-primary h-5 w-5" />
          </div>
          <p className="text-sm font-semibold">Upload a meeting</p>
          <p className="text-muted-foreground mt-1 max-w-[16rem] text-sm">
            Drop an audio file and GetGit will pull out issues from the call.
          </p>
          <Button type="button" variant="secondary" size="sm" className="mt-5">
            <Upload className="h-3.5 w-3.5" />
            Choose file
          </Button>
          <p className="text-muted-foreground mt-3 text-xs">MP3, WAV, AAC, or M4A · 50MB</p>
        </div>
      )}

      {isUploading && (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-10">
          <CircularProgressbar
            value={progress}
            text={`${progress}%`}
            className="size-16"
          />
          <div className="text-center">
            <p className="text-sm font-medium">Uploading meeting</p>
            <p className="text-muted-foreground mt-1 text-xs">
              This stays on the page until the file finishes.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MeetingCard;
