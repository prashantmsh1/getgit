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
    <Card className="col-span-5 md:col-span-2">
      {!isUploading && (
        <div className="flex flex-col items-center justify-center">
          <Presentation className="mx-auto h-20 w-20" />

          <div className="flex flex-col items-center justify-center px-4">
            <p className="font-medium text-gray-800">Create a New Meeting</p>
            <p className="text-center text-sm font-medium text-gray-500">
              Analyze your meeting with getgit Powered by AI
            </p>
          </div>
          <div className="cursor-pointer p-4">
            <Button {...getRootProps()}>
              {" "}
              <Upload />
              Upload
            </Button>
            <input {...getInputProps()} />
          </div>
        </div>
      )}

      {isUploading && (
        <div className="flex flex-col items-center justify-center">
          <CircularProgressbar
            value={progress}
            text={`${progress}%`}
            className="size-20"
          />
          <p className="text-center text-sm font-medium text-gray-500">
            Uploading your meeting...
          </p>
        </div>
      )}
    </Card>
  );
};

export default MeetingCard;
