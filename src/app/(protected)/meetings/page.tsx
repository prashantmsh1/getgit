"use client";
import useProjects from "@/hooks/use-project";
import React from "react";
import { api } from "@/trpc/react";
import MeetingCard from "../dashboard/meeting-card";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Copy,
  Video,
  Link as LinkIcon,
  Loader2,
  Info,
  Delete,
  DeleteIcon,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

const MeetingsPage = () => {
  const { projectId } = useProjects();
  const {
    data: meetings,
    isLoading,
    refetch,
  } = api.project.getMeetings.useQuery(
    {
      projectId: projectId ?? "",
    },
    // {
    //   refetchInterval: 4000,
    // },
  );

  const deleteMeeting = api.project.deletedMeetings.useMutation({
    onSuccess: async () => {
      toast.success("Meeting deleted successfully");
      await refetch();
    },
    onError: () => {
      toast.error("Failed to delete meeting");
    },
  });
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
      </div>

      <MeetingCard />

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="text-primary/60 h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && meetings && meetings.length === 0 && (
        <div className="bg-card/30 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 py-20 shadow-sm backdrop-blur-sm">
          <Video className="text-muted-foreground/50 h-10 w-10" />
          <h3 className="text-foreground text-lg font-semibold">
            No meetings found
          </h3>
          <p className="text-muted-foreground max-w-sm text-center text-sm">
            You don&apos;t have any meetings associated with this project yet.
            Create a new meeting to get started.
          </p>
        </div>
      )}

      {meetings && meetings.length > 0 && (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {meetings.map((meeting) => (
            <li key={meeting.id}>
              <Card className="hover:border-primary/40 group bg-card/60 relative flex h-full flex-col overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                <div className="from-primary/40 via-primary to-primary/40 absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100" />

                <CardHeader className="w-full px-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle
                      className="w-full text-[17px] font-semibold tracking-tight"
                      title={meeting.name}
                    >
                      {meeting.name || "Untitled Meeting"}
                    </CardTitle>
                  </div>
                  <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                    <span
                      className="truncate text-ellipsis"
                      title={`Project: ${meeting.projectId}`}
                    >
                      Proj: {meeting.project.name}
                    </span>

                    <Badge
                      className={`shrink-0 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase shadow-sm ${
                        meeting.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-600 hover:bg-green-500/30 dark:text-green-400"
                          : "bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 dark:text-blue-400"
                      }`}
                    >
                      {meeting.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="w-full flex-1 px-5">
                  <div className="flex flex-col gap-3 py-1">
                    <div className="text-foreground/80 flex items-center gap-2.5 text-sm">
                      <div className="bg-primary/10 text-primary shrink-0 rounded-md p-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate text-[13px] font-medium">
                        {format(
                          new Date(meeting.createdAt),
                          "MMM d, yyyy • h:mm a",
                        )}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2.5 text-sm">
                      <div className="bg-muted shrink-0 rounded-md p-1.5">
                        <Clock className="h-3.5 w-3.5 opacity-70" />
                      </div>
                      <span className="truncate text-[13px]">
                        Updated:{" "}
                        {format(
                          new Date(meeting.updatedAt),
                          "MMM d, yyyy • h:mm a",
                        )}
                      </span>
                    </div>

                    <div className="bg-muted/30 group/link hover:bg-muted/50 relative mt-3 flex items-center justify-between overflow-hidden rounded-xl border p-2 transition-colors">
                      <div className="flex w-full items-center gap-2 overflow-hidden px-1">
                        <LinkIcon className="text-foreground/60 h-3.5 w-3.5 shrink-0" />
                        <span className="text-muted-foreground group-hover/link:text-foreground truncate font-mono text-xs transition-colors">
                          {meeting.meetingUrl}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-background ml-1 h-7 w-7 shrink-0 shadow-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void navigator.clipboard.writeText(
                            meeting.meetingUrl,
                          );
                          toast.success("Meeting URL copied to clipboard", {
                            description: "You can now share it with your team.",
                          });
                        }}
                        title="Copy URL"
                      >
                        <Copy className="text-foreground/70 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="mt-auto flex w-full gap-3 px-5 pt-0">
                  <Button
                    asChild
                    variant="outline"
                    className="hover:bg-primary/5 hover:text-primary hover:border-primary/20 h-9 flex-1 text-[13px] font-medium shadow-sm transition-colors"
                    size="sm"
                  >
                    <Link href={`/meetings/${meeting.id}`}>
                      <Info className="mr-1.5 h-3.5 w-3.5" />
                      View Meeting
                    </Link>
                  </Button>
                  <Button
                    className="shadow-primary/20 hover:shadow-primary/30 h-9 flex-1 bg-red-600 text-[13px] font-medium shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
                    size="sm"
                    onClick={() => {
                      deleteMeeting.mutate({ meetingId: meeting.id });
                    }}
                  >
                    <Trash />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MeetingsPage;
