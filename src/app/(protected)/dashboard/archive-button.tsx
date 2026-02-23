"use client";
import React from "react";

import { Button } from "@/components/ui/button";
import useProjects from "@/hooks/use-project";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";

const ArchiveButton = () => {
  const archiveProject = api.project.archiveProject.useMutation();

  const { projectId } = useProjects();
  const refetch = useRefetch();

  return (
    <Button
      disabled={archiveProject.isPending}
      onClick={() => {
        const confirm = window.confirm(
          "Are you sure you want to archive this project?",
        );
        if (confirm) {
          archiveProject.mutate(
            { projectId },
            {
              onSuccess: () => {
                toast.success("Project archived successfully");
                void refetch();
              },
              onError: () => {
                toast.error("Failed to archive project");
              },
            },
          );
        }
      }}
      variant={"destructive"}
    >
      {archiveProject.isPending ? "Archiving..." : "Archive"}
    </Button>
  );
};

export default ArchiveButton;
