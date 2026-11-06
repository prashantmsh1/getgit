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
  const { projectId, project } = useProjects();

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
      <Card className="border-destructive/30 bg-destructive/5 shadow-none">
        <CardContent className="flex items-start gap-3">
          <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-destructive font-medium">
              Commit history is unavailable
            </p>
            <p className="text-destructive/80 mt-1 text-sm">
              The latest commits could not be loaded. Refresh the page to try
              again.
            </p>
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

  const repoUrl = project?.githubUrl?.replace(/\.git$/, "").replace(/\/$/, "");

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Commit history</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {commits.length} commit{commits.length === 1 ? "" : "s"} summarized
            for this repository.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {commits.map((commit, index) => {
          const commitUrl = repoUrl
            ? `${repoUrl}/commit/${commit.commitHash}`
            : undefined;

          return (
            <div key={commit.id} className="relative pl-8">
              <div
                className={cn(
                  "bg-border absolute top-3 left-[11px] w-px",
                  index === commits.length - 1 ? "h-4" : "bottom-[-18px]",
                )}
              />
              <Avatar className="ring-background absolute top-4 left-0 z-10 h-6 w-6 ring-4">
                <AvatarImage
                  src={commit.commitAuthorAvatar}
                  alt={commit.commitAuthorName}
                />
                <AvatarFallback className="text-[10px]">
                  {commit.commitAuthorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <article className="bg-card hover:border-primary/30 rounded-xl border p-4 shadow-sm transition-colors">
                <p className="line-clamp-2 text-sm font-semibold">
                  {commit.commitMessage}
                </p>

                {commit.summary.trim() && (
                  <div className="bg-muted/50 text-foreground mt-3 rounded-lg px-3 py-2.5 text-sm leading-6 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
                    <ReactMarkdown>{commit.summary}</ReactMarkdown>
                  </div>
                )}

                <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <span className="font-medium">{commit.commitAuthorName}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(commit.commitDate), {
                      addSuffix: true,
                    })}
                  </span>
                  {commitUrl ? (
                    <a
                      href={commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground inline-flex items-center gap-1"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <code className="bg-muted rounded-md px-1.5 py-0.5 font-mono">
                        {commit.commitHash.substring(0, 7)}
                      </code>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Code2 className="h-3.5 w-3.5" />
                      <code className="bg-muted rounded-md px-1.5 py-0.5 font-mono">
                        {commit.commitHash.substring(0, 7)}
                      </code>
                    </span>
                  )}
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CommitLog;
