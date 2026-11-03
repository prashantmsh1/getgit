import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { indexRepository } from "@/lib/repo-index";
import { runIncrementalSync } from "@/server/workers/incremental-sync";
import { pullCommits } from "@/lib/github";

type IndexRequest = {
  projectId: string;
  githubUrl: string;
  githubToken?: string;
  branch?: string;
};

function readIndexRequest(data: unknown): IndexRequest | undefined {
  if (!data || typeof data !== "object") return undefined;

  const record = data as Record<string, unknown>;
  const nested = record.data;
  const source =
    typeof record.projectId === "string"
      ? record
      : nested &&
          typeof nested === "object" &&
          typeof (nested as Record<string, unknown>).projectId === "string"
        ? (nested as Record<string, unknown>)
        : undefined;

  if (!source || typeof source.githubUrl !== "string") return undefined;

  return {
    projectId: source.projectId as string,
    githubUrl: source.githubUrl,
    githubToken:
      typeof source.githubToken === "string" ? source.githubToken : undefined,
    branch: typeof source.branch === "string" ? source.branch : undefined,
  };
}

export const indexProjectFunction = inngest.createFunction(
  {
    id: "index-project-repo",
    retries: 2,
    triggers: [{ event: "project/index.requested" }],
  },
  async ({ event, events, step }) => {
    const request =
      readIndexRequest(event.data) ??
      events
        .map((item) => readIndexRequest(item.data))
        .find((item) => item !== undefined);

    if (!request) {
      throw new NonRetriableError(
        "project/index.requested is missing projectId or githubUrl",
      );
    }

    // Pass the payload as a step argument so a later step execution
    // uses the saved input instead of a fresh closure over event.data.
    await step.run(
      "summarize-and-embed-repo",
      async (input: IndexRequest) => {
        await indexRepository(
          input.projectId,
          input.githubUrl,
          input.githubToken,
          input.branch,
        );
      },
      request,
    );
  },
);

type SyncRequest = {
  projectId: string;
  owner: string;
  repo: string;
  branch?: string;
  githubToken?: string;
};

function readSyncRequest(data: unknown): SyncRequest | undefined {
  if (!data || typeof data !== "object") return undefined;

  const record = data as Record<string, unknown>;
  const nested = record.data;
  const source =
    typeof record.projectId === "string"
      ? record
      : nested &&
          typeof nested === "object" &&
          typeof (nested as Record<string, unknown>).projectId === "string"
        ? (nested as Record<string, unknown>)
        : undefined;

  if (
    !source ||
    typeof source.owner !== "string" ||
    typeof source.repo !== "string"
  ) {
    return undefined;
  }

  return {
    projectId: source.projectId as string,
    owner: source.owner as string,
    repo: source.repo as string,
    branch: typeof source.branch === "string" ? source.branch : "main",
    githubToken:
      typeof source.githubToken === "string" ? source.githubToken : undefined,
  };
}

export const syncProjectFunction = inngest.createFunction(
  {
    id: "sync-project-repo",
    retries: 2,
    triggers: [{ event: "project/sync.requested" }],
  },
  async ({ event, events, step }) => {
    const request =
      readSyncRequest(event.data) ??
      events
        .map((item) => readSyncRequest(item.data))
        .find((item) => item !== undefined);

    if (!request) {
      throw new NonRetriableError(
        "project/sync.requested is missing projectId, owner, or repo",
      );
    }

    await step.run(
      "run-incremental-sync",
      async (input: SyncRequest) => {
        await runIncrementalSync(
          input.projectId,
          input.owner,
          input.repo,
          input.branch ?? "main",
          input.githubToken,
        );
        try {
          await pullCommits(input.projectId, input.githubToken);
        } catch (e) {
          console.warn("Failed to pull commits during sync:", e);
        }
      },
      request,
    );
  },
);
