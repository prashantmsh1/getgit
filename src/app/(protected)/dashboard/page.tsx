"use client";
import React, { useEffect } from "react";

import useProjects from "@/hooks/use-project";
import { ExternalLink, Github, Folder, FolderPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CommitLog from "./commit-log";
import AskQuestion from "./ask-question-card";
import MeetingCard from "./meeting-card";
import ArchiveButton from "./archive-button";
import InviteButton from "./invite-button";
import { useParams } from "next/navigation";

const DashboardPage = () => {
  const { project, setProjectId } = useProjects();
  const params = useParams<{ projectId: string }>();

  useEffect(() => {
    if (params.projectId) {
      setProjectId(params.projectId);
    }
  }, [params.projectId, setProjectId]);

  if (!project) {
    return (
      <div className="flex h-[75vh] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-gray-50/50 shadow-sm">
        <div className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-transform hover:scale-105">
          <Folder className="text-primary h-10 w-10" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900">
          Project Not Found
        </h2>
        <p className="mb-8 max-w-md text-center text-sm text-gray-500">
          We couldn&apos;t find the project you are looking for. It may have
          been deleted, or you might not have selected one yet.
        </p>
        <Link href="/create">
          <Button className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4" />
            Create New Project
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="w-full rounded-xl border-1 border-slate-200 bg-gray-50 p-4 shadow-md">
      <div className="flex w-full items-center justify-between">
        <div className="bg-primary mb-4 flex w-fit items-center gap-2 rounded-md px-4 py-2 text-white">
          <Github className="h-6 w-6 text-gray-50" />
          <div className="flex">
            <p className="flex items-center gap-2">
              This project is linked to
              {project?.githubUrl && (
                <Link
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 underline"
                >
                  {project.githubUrl}
                  <ExternalLink className="h-4 w-4 text-gray-50" />
                </Link>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-x-4">
            <InviteButton />
            <ArchiveButton />
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-5 gap-x-4">
        <AskQuestion className="col-span-5 md:col-span-3" />
        <MeetingCard />
      </div>

      <div>
        <CommitLog />
      </div>
    </div>
  );
};

export default DashboardPage;
