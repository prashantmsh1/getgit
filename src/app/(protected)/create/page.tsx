"use client";
import { Input } from "@/components/ui/input";
import useRefetch from "@/hooks/use-refetch";
import { api } from "@/trpc/react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FormInput = {
  repoUrl: string;
  projectName: string;
  githubToken?: string;
};

const CreatePage = () => {
  const { register, handleSubmit, reset } = useForm<FormInput>();
  const [loading, setLoading] = useState(false);
  const createProject = api.project.createProject.useMutation();
  const refetch = useRefetch();

  function onSubmit(data: FormInput) {
    createProject.mutate(
      {
        name: data.projectName,
        githubUrl: data.repoUrl,
        githubToken: data.githubToken ?? "",
      },
      {
        onSuccess: () => {
          toast.success("Project created successfully!");
          void refetch();
          reset();
        },
        onError: (err) => {
          toast.error(err.message); // Display the error message from the server
        },
      },
    );
  }
  return (
    <div className="flex h-screen items-center justify-center gap-4 rounded">
      <div>Image</div>
      <div>
        <div>
          <h1 className="text-xl font-bold">Link your Github Repository</h1>
          <p className="font-medium text-gray-600">
            Enter the URL of your Github repository to Link it to the site.
          </p>
        </div>
        <div className="mt-4 w-96">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="h-2"></div>
            <Input
              required
              {...register("repoUrl")}
              placeholder="Enter your Github repository URL"
            />

            <div className="h-2"></div>

            <Input
              required
              {...register("projectName")}
              placeholder="Enter your Project Name"
            />
            <div className="h-2"></div>
            <Input
              {...register("githubToken")}
              placeholder="Enter your Github Personal Access Token (optional)"
            />
            <button className="bg-primary hover:bg-primary/90 mt-4 rounded px-4 py-2 font-semibold text-white">
              Create Project
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
