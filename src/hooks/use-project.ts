import React from "react";
import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";

const useProjects = () => {
  const { data: projects } = api.project.getProjects.useQuery();
  const [projectId, setProjectId] = useLocalStorage("getgit-projectId", "");

  const project = projects?.find((p) => p.id === projectId);

  console.log("project", project);
  return {
    projects,
    project,
    projectId,
    setProjectId,
  };
};

export default useProjects;
