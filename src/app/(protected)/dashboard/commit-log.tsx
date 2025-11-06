"use client";

import useProjects from "@/hooks/use-project";
import { api } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { GitCommit, Clock, Code2, AlertCircle } from "lucide-react";
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const CommitLog = () => {
  const { projectId } = useProjects();

  const {
    data: commits,
    isLoading,
    error,
  } = api.project.getCommits.useQuery(
    { projectId: projectId || "" },
    {
      enabled: !!projectId,
    },
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center gap-3 p-6">
          <AlertCircle className="text-destructive h-5 w-5" />
          <div>
            <p className="text-destructive font-medium">
              Failed to load commits
            </p>
            <p className="text-destructive/80 text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!commits || commits.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
          <GitCommit className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground text-center text-sm">
            No commits found for this project yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Commit History</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Showing {commits.length} commit{commits.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-0">
        {commits.map((commit, index) => (
          <div
            key={commit.id}
            className="hover:bg-accent/50 relative h-auto overflow-hidden border-0 bg-transparent bg-none p-0"
          >
            <div
              className={cn(
                index === commits.length - 1 ? "h-6" : "-bottom-8",
                "absolute top-0 left-0 flex w-6 justify-center",
              )}
            >
              <div className="w-px translate-x-2 bg-gray-300"></div>
            </div>
            <CardContent className="p-2">
              <div className="flex items-start gap-4">
                {/* Timeline dot */}
                <div className="mt-1 flex flex-col items-center">
                  <div className="">
                    {/* <GitCommit className="h-5 w-5 text-white" /> */}
                    <Avatar className="z-20 mt-8 h-6 w-6">
                      <AvatarImage
                        src={commit.commitAuthorAvatar}
                        alt={commit.commitAuthorName}
                      />
                      <AvatarFallback>
                        {commit.commitAuthorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Commit details */}
                <div className="flex-1 space-y-2 rounded border p-4">
                  {/* Message */}
                  <div>
                    <p className="text-foreground line-clamp-2 font-semibold">
                      {commit.commitMessage}
                    </p>
                  </div>

                  {/* Summary */}
                  {commit.summary && (
                    <div className="bg-muted/50 text-muted-foreground rounded-md p-3 text-sm">
                      <ReactMarkdown>{commit.summary}</ReactMarkdown>{" "}
                      {/* Replace <p> with ReactMarkdown */}
                    </div>
                  )}

                  {/* Metadata row */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    {/* Author */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={commit.commitAuthorAvatar}
                          alt={commit.commitAuthorName}
                        />
                        <AvatarFallback>
                          {commit.commitAuthorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-xs font-medium">
                        {commit.commitAuthorName}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {formatDistanceToNow(new Date(commit.commitDate), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Commit hash */}
                    <div className="flex items-center gap-1">
                      <Code2 className="text-muted-foreground h-3.5 w-3.5" />
                      <code className="bg-muted rounded px-2 py-1 font-mono text-xs">
                        {commit.commitHash.substring(0, 7)}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommitLog;
