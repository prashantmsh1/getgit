"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useRefetch from "@/hooks/use-refetch";
import useProjects from "@/hooks/use-project";
import { api } from "@/trpc/react";
import { GitBranch, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FormInput = {
  repoUrl: string;
  projectName: string;
  githubToken?: string;
  branch: string;
};

const GITHUB_REPO_URL =
  /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i;

const CreatePage = () => {
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormInput>(
    {
      defaultValues: {
        repoUrl: "",
        projectName: "",
        githubToken: "",
        branch: "",
      },
    },
  );
  const checkCredits = api.project.checkCredits.useMutation();
  const createProject = api.project.createProject.useMutation();
  const refetch = useRefetch();
  const { setProjectId } = useProjects();
  const router = useRouter();

  const repoUrl = watch("repoUrl");
  const githubToken = watch("githubToken");
  const selectedBranch = watch("branch");

  const [debouncedUrl, setDebouncedUrl] = useState("");
  const [debouncedToken, setDebouncedToken] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedUrl(repoUrl.trim());
      setDebouncedToken(githubToken?.trim() ?? "");
    }, 400);
    return () => clearTimeout(timeout);
  }, [repoUrl, githubToken]);

  const canLoadBranches = GITHUB_REPO_URL.test(
    debouncedUrl.replace(/\.git$/, ""),
  );

  const branchesQuery = api.repository.getBranches.useQuery(
    {
      githubUrl: debouncedUrl,
      githubToken: debouncedToken || undefined,
    },
    { enabled: canLoadBranches, retry: false },
  );

  const branchNames = branchesQuery.data?.branches ?? [];

  useEffect(() => {
    if (repoUrl.trim() !== debouncedUrl) return;
    if (!branchNames.length) return;
    if (selectedBranch && branchNames.includes(selectedBranch)) return;
    const defaultBranch = branchesQuery.data?.defaultBranch;
    const preferred =
      (defaultBranch &&
        branchNames.includes(defaultBranch) &&
        defaultBranch) ||
      branchNames.find((name) => name === "main") ||
      branchNames.find((name) => name === "master") ||
      branchNames[0];
    if (preferred) {
      setValue("branch", preferred);
    }
  }, [
    repoUrl,
    debouncedUrl,
    branchNames,
    branchesQuery.data?.defaultBranch,
    selectedBranch,
    setValue,
  ]);

  function onSubmit(data: FormInput) {
    if (!data.branch) {
      toast.error("Select a branch to continue.");
      return;
    }

    if (!!checkCredits.data) {
      createProject.mutate(
        {
          name: data.projectName,
          githubUrl: data.repoUrl,
          githubToken: data.githubToken ?? "",
          branch: data.branch,
        },
        {
          onSuccess: (project) => {
            toast.success("Project created successfully!");
            setProjectId(project.id);
            void refetch();
            reset();
            router.push(`/dashboard?projectId=${project.id}`);
          },
          onError: (err) => {
            toast.error(err.message);
          },
        },
      );
    } else {
      checkCredits.mutate(
        {
          githubUrl: data.repoUrl,
          githubToken: data.githubToken ?? "",
          branch: data.branch,
        },
        {
          onSuccess: (credits) => {
            if (credits.userCredits < credits.fileCount) {
              toast.error(
                "You don't have enough credits to create this project.",
              );
            }
          },
          onError: (err) => {
            toast.error(err.message);
          },
        },
      );
    }
  }

  const hasEnoughCredits = checkCredits?.data
    ? checkCredits.data.userCredits >= checkCredits.data.fileCount
    : true;

  const branchPlaceholder = !canLoadBranches
    ? "Enter a GitHub repository URL"
    : branchesQuery.isFetching
      ? "Loading branches..."
      : branchesQuery.isError
        ? "Couldn't load branches"
        : branchNames.length === 0
          ? "No branches found"
          : "Select a branch";

  return (
    <div className="flex items-start justify-center gap-12 px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <div>
          <h1 className="text-xl font-bold">Link your GitHub repository</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add the repository, choose the branch to index, and name the
            project.
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="repoUrl">Repository URL</Label>
            <Input
              id="repoUrl"
              required
              {...register("repoUrl", {
                onChange: () => {
                  setValue("branch", "");
                  checkCredits.reset();
                },
              })}
              placeholder="https://github.com/owner/repo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Select
              value={selectedBranch || undefined}
              onValueChange={(value) => {
                setValue("branch", value);
                checkCredits.reset();
              }}
              disabled={!branchNames.length || branchesQuery.isFetching}
            >
              <SelectTrigger id="branch" className="w-full">
                <GitBranch className="text-muted-foreground size-4" />
                <SelectValue placeholder={branchPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {branchNames.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                    {branch === branchesQuery.data?.defaultBranch
                      ? " (default)"
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {branchesQuery.isError ? (
              <p className="text-sm text-red-600">
                {branchesQuery.error.message}
              </p>
            ) : branchesQuery.isFetching ? (
              <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <Loader2 className="size-3 animate-spin" />
                Fetching branches
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectName">Project name</Label>
            <Input
              id="projectName"
              required
              {...register("projectName")}
              placeholder="My project"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="githubToken">GitHub token</Label>
            <Input
              id="githubToken"
              {...register("githubToken", {
                onChange: () => {
                  checkCredits.reset();
                },
              })}
              placeholder="Optional — uses your Clerk GitHub login"
            />
          </div>

          {!!checkCredits.data && (
            <p className="text-sm text-gray-600">
              You have {checkCredits.data.userCredits} credits.
              <span
                className={hasEnoughCredits ? "text-green-600" : "text-red-600"}
              >
                {" "}
                This project requires {checkCredits.data.fileCount} credits.
              </span>
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              createProject.isPending ||
              checkCredits.isPending ||
              !hasEnoughCredits ||
              !selectedBranch
            }
          >
            {createProject.isPending || checkCredits.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {createProject.isPending
                  ? "Creating project..."
                  : "Checking credits..."}
              </>
            ) : (
              <>{!!checkCredits.data ? "Create project" : "Check credits"}</>
            )}
          </Button>
        </form>
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
