"use client";

import { api } from "@/trpc/react";
import React from "react";
import { format } from "date-fns";
import {
  Loader2,
  Calendar,
  FileText,
  Clock,
  FileAudio,
  ArrowLeft,
  Github,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = {
  meetingId: string;
};

const IssuesList = ({ meetingId }: Props) => {
  const { data: meeting, isLoading } = api.project.getMeetingById.useQuery({
    meetingId,
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Meeting not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-4 md:p-6 lg:p-8">
      {/* Top Banner / Navigation */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Button
          variant="ghost"
          asChild
          className="w-fit gap-2 pl-0 hover:bg-transparent"
        >
          <Link href="/meetings">
            <ArrowLeft className="h-4 w-4" />
            Back to Meetings
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Badge
            variant={meeting.status === "COMPLETED" ? "default" : "secondary"}
          >
            {meeting.status}
          </Badge>
        </div>
      </div>

      {/* Meeting Overview Header */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            {meeting.name}
          </h1>
          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(meeting.createdAt), "PPP")}
            </div>
            {meeting.project && (
              <div className="bg-secondary/50 flex items-center gap-1.5 rounded-md border px-2 py-1 shadow-sm">
                <Github className="h-4 w-4" />
                <span className="text-secondary-foreground font-medium">
                  {meeting.project.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-4">
          <Button
            asChild
            className="gap-2 shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
          >
            <a
              href={meeting.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileAudio className="h-4 w-4" />
              Play Audio
            </a>
          </Button>
          {meeting.project?.githubUrl && (
            <Button
              variant="outline"
              asChild
              className="gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <a
                href={meeting.project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                View Repository
              </a>
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Issues Grid / List */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2">
          <FileText className="text-primary h-6 w-6" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Meeting Notes & Issues
          </h2>
        </div>

        {meeting.issues && meeting.issues.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {meeting.issues.map((issue) => (
              <Card
                key={issue.id}
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardHeader className="bg-secondary/20 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base leading-snug">
                      {issue.headline}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="bg-background text-primary shrink-0"
                    >
                      {issue.gist}
                    </Badge>
                  </div>
                  <CardDescription className="text-primary mt-2 flex items-center gap-1.5 font-mono text-xs">
                    <Clock className="h-3 w-3" />
                    {issue.start} - {issue.end}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <p className="text-foreground/90 text-sm leading-relaxed font-medium">
                    {issue.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border-border bg-secondary/10 flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <FileText className="text-muted-foreground mb-4 h-10 w-10 opacity-50" />
            <p className="text-foreground text-lg font-medium">
              No issues found
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              This meeting doesn&apos;t have any generated issues or notes yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuesList;
