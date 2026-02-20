"use client";
import { Input } from "@/components/ui/input";
import useRefetch from "@/hooks/use-refetch";
import { api } from "@/trpc/react";
import React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type FormInput = {
  repoUrl: string;
  projectName: string;
  githubToken?: string;
};

const CreatePage = () => {
  const { register, handleSubmit, reset } = useForm<FormInput>();
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
    <div className="-mt-24 flex h-screen items-center justify-center gap-12 rounded px-4 sm:px-6">
      <div className="w-full max-w-md">
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
            <button
              disabled={createProject.isPending}
              className="bg-primary hover:bg-primary/90 mt-4 flex items-center gap-2 rounded px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Project...
                </>
              ) : (
                "Create Project"
              )}
            </button>
          </form>
        </div>
      </div>
      <div className="hidden items-center justify-center rounded-3xl bg-gray-50/50 p-8 shadow-2xl ring-1 shadow-gray-200/20 ring-gray-200/50 lg:flex dark:bg-white/5 dark:shadow-none dark:ring-white/10">
        <Image
          src="/create-illustration-Photoroom.png"
          alt="Create Project"
          width={450}
          height={450}
          className="object-contain transition-transform duration-500 hover:scale-105"
        />
      </div>
    </div>
  );
};

export default CreatePage;
