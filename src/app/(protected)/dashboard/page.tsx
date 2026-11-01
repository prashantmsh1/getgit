"use client";
import React, { useEffect } from "react";

import useProjects from "@/hooks/use-project";
import { ExternalLink, Folder, FolderPlus, GitBranch, Github } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CommitLog from "./commit-log";
import AskQuestion from "./ask-question-card";
import MeetingCard from "./meeting-card";
import ArchiveButton from "./archive-button";
import InviteButton from "./invite-button";
import TeamMembers from "./team-members";
import { useParams } from "next/navigation";

function repoLabel(githubUrl: string) {
  try {
    const path = new URL(githubUrl).pathname.replace(/^\//, "").replace(/\.git$/, "");
    return path || githubUrl;
  } catch {
    return githubUrl
      .replace(/^https?:\/\/(www\.)?github\.com\//, "")
      .replace(/\.git$/, "");
  }
}

const DashboardPage = () => {
  const { project, projects, setProjectId, isLoading } = useProjects();
  const params = useParams<{ projectId: string }>();

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get(
      "projectId",
    );
    const fromRoute =
      typeof params.projectId === "string" ? params.projectId : undefined;
    const nextProjectId = fromQuery || fromRoute;
    if (nextProjectId) {
      setProjectId(nextProjectId);
    }
  }, [params.projectId, setProjectId]);

  if (isLoading || !projects) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Skeleton className="h-56 rounded-xl lg:col-span-3" />
          <Skeleton className="h-56 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6">
        <div className="bg-primary/10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Folder className="text-primary h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Project not found</h2>
        <p className="text-muted-foreground mt-2 max-w-sm text-center text-sm">
          This project may have been archived, or you have not opened one yet.
        </p>
        <Link href="/create" className="mt-6">
          <Button>
            <FolderPlus className="h-4 w-4" />
            Create project
          </Button>
        </Link>
      </div>
    );
  }

  const commitCount = project.Commit?.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
      <header className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="bg-primary text-primary-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold shadow-sm">
              {project.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Project
              </p>
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {project.githubUrl && (
                  <Link
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex max-w-full items-center gap-1.5 text-sm transition-colors"
                  >
                    <Github className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{repoLabel(project.githubUrl)}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                {project.branch && (
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <GitBranch className="h-3 w-3" />
                    {project.branch}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TeamMembers />
            <InviteButton />
            <ArchiveButton />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">Commits indexed</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{commitCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Created</p>
            <p className="mt-1 text-lg font-semibold">
              {new Date(project.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-muted-foreground text-xs">Last updated</p>
            <p className="mt-1 text-lg font-semibold">
              {new Date(project.updatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
        <AskQuestion className="lg:col-span-3" />
        <MeetingCard />
      </div>

      <CommitLog />
    </div>
  );
};

export default DashboardPage;
