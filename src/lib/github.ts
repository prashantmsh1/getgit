import { db } from "@/server/db";
// import { db } from "../server/db";
import axios from "axios";
import { Octokit } from "octokit";
import { aiSummariseCommit } from "./gemini";
import { isFailed, isReady, isSummarizing } from "@/utils/dbUtils/indexStatus";

export function createOctokit(githubToken?: string) {
  return new Octokit({
    auth: githubToken,
  });
}

const githubUrl = "https://github.com/docker/genai-stack";

type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

export const getCommitHashes = async (
  githubUrl: string,
  githubToken?: string,
  branch?: string,
): Promise<Response[]> => {
  // Extract owner and repo from the GitHub URL

  console.log("GitHub URL:", githubUrl);
  const [owner, repo] = githubUrl.split("/").slice(-2);

  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL");
  }

  const octokit = createOctokit(githubToken);
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    per_page: 100,
    ...(branch ? { sha: branch } : {}),
  });

  const sortCommits = data.sort(
    (a, b) =>
      new Date(b.commit.author!.date!).getTime() -
      new Date(a.commit.author!.date!).getTime(),
  );
  return sortCommits.slice(0, 15).map((commit) => ({
    commitHash: commit.sha,
    commitMessage: commit.commit.message,
    commitAuthorName: commit.commit.author!.name!,
    commitAuthorAvatar: commit.author?.avatar_url ?? "",
    commitDate: commit.commit.author!.date!,
  }));
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("status" in error && typeof (error as { status: unknown }).status === "number") {
    return (error as { status: number }).status;
  }
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

export const pullCommits = async (projectId: string, githubToken?: string) => {
  const { githubUrl, branch } = await fetchProjectGithubUrl(projectId);
  await isSummarizing(projectId);
  try {
    const commitHashes = await getCommitHashes(githubUrl, githubToken, branch);

    const { toCreate, toUpdate } = await commitsNeedingSummary(
      commitHashes,
      projectId,
    );
    const pending = [...toCreate, ...toUpdate];

    const summaries: string[] = [];
    let rateLimited = false;

    // Process sequentially with a delay to prevent secondary rate limiting
    for (const [index, commit] of pending.entries()) {
      if (rateLimited) {
        summaries.push("");
        continue;
      }

      if (index > 0) {
        await sleep(500);
      }

      try {
        const summary = await summariseCommits(
          githubUrl,
          commit.commitHash,
          githubToken,
        );
        summaries.push(summary.trim());
      } catch (error) {
        const status = getErrorStatus(error);
        const errMsg = error instanceof Error ? error.message : "Failed to summarize";
        console.error(
          "Failed to summarise commit",
          commit.commitHash,
          status ? `status: ${status}` : errMsg,
        );
        if (status === 429 || status === 403) {
          rateLimited = true;
          console.warn(
            "GitHub rate limit hit while summarizing commits. Remaining commits will be saved without summaries and can be backfilled later.",
          );
        }
        summaries.push("");
      }
    }

    console.log("Summarised Commits:", summaries);
    const creates = toCreate.flatMap((commit, index) => {
      const summary = summaries[index] ?? "";
      return [
        {
          projectId,
          commitHash: commit.commitHash,
          commitMessage: commit.commitMessage,
          commitAuthorName: commit.commitAuthorName,
          commitAuthorAvatar: commit.commitAuthorAvatar,
          commitDate: commit.commitDate,
          summary,
        },
      ];
    });

    if (creates.length > 0) {
      await db.commit.createMany({ data: creates });
    }

    await Promise.all(
      toUpdate.map(async (commit, index) => {
        const summary = summaries[toCreate.length + index] ?? "";
        if (!summary) {
          return;
        }
        await db.commit.update({
          where: { id: commit.id },
          data: { summary },
        });
      }),
    );

    console.log("Unprocessed Commits:", pending);
    await isReady(projectId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to index commits";
    await isFailed(projectId, message);
    throw error;
  }
};

const STORED_COMMIT_BATCH = 3;

function githubRepoFromUrl(githubUrl: string) {
  const [owner, repo] = githubUrl.split("/").slice(-2);
  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL");
  }
  return { owner, repo: repo.replace(/\.git$/, "") };
}

async function fetchCommitDiff(
  githubUrl: string,
  commitHash: string,
  githubToken?: string,
) {
  const { owner, repo } = githubRepoFromUrl(githubUrl);
  const octokit = createOctokit(githubToken);
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{ref}",
    {
      owner,
      repo,
      ref: commitHash,
      headers: {
        accept: "application/vnd.github.diff",
      },
    },
  );
  return typeof response.data === "string"
    ? response.data
    : String(response.data ?? "");
}

async function summariseCommits(
  githubUrl: string,
  commitHash: string,
  githubToken?: string,
) {
  const diff = await fetchCommitDiff(githubUrl, commitHash, githubToken);
  const clipped = diff.length > 20000 ? diff.slice(0, 20000) : diff;
  return (await aiSummariseCommit(clipped)) ?? "";
}

export async function summariseStoredCommits(
  projectId: string,
  githubToken?: string,
) {
  const { githubUrl } = await fetchProjectGithubUrl(projectId);
  const commits = await db.commit.findMany({
    where: { projectId },
    select: { id: true, commitHash: true, summary: true },
    orderBy: { commitDate: "desc" },
  });
  const blank = commits.filter((commit) => !commit.summary.trim());
  const batch = blank.slice(0, STORED_COMMIT_BATCH);

  let summarised = 0;
  let rateLimited = false;

  for (const [index, commit] of batch.entries()) {
    if (index > 0) {
      await sleep(750);
    }
    try {
      const summary = (
        await summariseCommits(githubUrl, commit.commitHash, githubToken)
      ).trim();
      if (!summary) {
        continue;
      }
      await db.commit.update({
        where: { id: commit.id },
        data: { summary },
      });
      summarised += 1;
    } catch (error) {
      const status = getErrorStatus(error);
      const errMsg = error instanceof Error ? error.message : "Failed to summarize";
      console.error(
        "Failed to summarise stored commit",
        commit.commitHash,
        status ? `status: ${status}` : errMsg,
      );
      if (status === 429 || status === 403) {
        rateLimited = true;
        break;
      }
    }
  }

  return {
    summarised,
    remaining: blank.length - summarised,
    rateLimited,
  };
}

export const fetchProjectGithubUrl = async (projectId: string) => {
  // Fetch project details from your database or API

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      githubUrl: true,
      branch: true,
    },
  });
  return {
    projects: project,
    githubUrl: project?.githubUrl ?? "",
    branch: project?.branch ?? undefined,
  };
};

async function commitsNeedingSummary(
  commitHashes: Response[],
  projectId: string,
) {
  const existingCommits = await db.commit.findMany({
    where: {
      projectId: projectId,
      commitHash: {
        in: commitHashes.map((commit) => commit.commitHash),
      },
    },
    select: {
      id: true,
      commitHash: true,
      summary: true,
    },
  });

  const existingByHash = new Map(
    existingCommits.map((commit) => [commit.commitHash, commit]),
  );

  const toCreate: Response[] = [];
  const toUpdate: Array<Response & { id: number }> = [];

  for (const commit of commitHashes) {
    const existing = existingByHash.get(commit.commitHash);
    if (!existing) {
      toCreate.push(commit);
      continue;
    }
    if (!existing.summary.trim()) {
      toUpdate.push({ ...commit, id: existing.id });
    }
  }

  return { toCreate, toUpdate };
}

// Example usage
// (async () => {
// })();

// console.log(await getCommitHashes(githubUrl));

// console.log("88888888888", pullCommits("9946338b-7514-4efc-b005-b7203cce331e"));
