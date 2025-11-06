"use client";
import React from "react";

import useProjects from "@/hooks/use-project";
import { ExternalLink, Github, Share } from "lucide-react";
import Link from "next/link";
import CommitLog from "./commit-log";
import AskQuestion from "./ask-question-card";

const DashboardPage = () => {
  const { project, projectId, setProjectId } = useProjects();

  console.log("project", project);
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
          <div>Team member</div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-5">
        <AskQuestion className="col-span-5 md:col-span-3" />
        <div>Meeting</div>
      </div>

      <div>
        <CommitLog />
      </div>
    </div>
  );
};

export default DashboardPage;
