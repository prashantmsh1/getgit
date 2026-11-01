import { db } from "@/server/db";
// import { db } from "../server/db";
import axios from "axios";
import { Octokit } from "octokit";
import { aiSummariseCommit } from "./gemini";

export function createOctokit(githubToken: string) {
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

export const pullCommits = async (projectId: string, githubToken?: string) => {
  const { githubUrl, branch } = await fetchProjectGithubUrl(projectId);

  const commitHashes = await getCommitHashes(githubUrl, githubToken, branch);

  const { toCreate, toUpdate } = await commitsNeedingSummary(
    commitHashes,
    projectId,
  );
  const pending = [...toCreate, ...toUpdate];

  const summaries = await Promise.all(
    pending.map(async (commit) => {
      try {
        const summary = await summariseCommits(
          githubUrl,
          commit.commitHash,
          githubToken,
        );
        return summary.trim();
      } catch (error) {
        console.error("Failed to summarise commit", commit.commitHash, error);
        return "";
      }
    }),
  );

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
};

async function summariseCommits(
  githubUrl: string,
  commitHash: string,
  githubToken?: string,
) {
  const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
    headers: {
      Accept: "application/vnd.github.v3.diff",
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
    },
    responseType: "text",
  });

  const diff = String(data);
  const clipped = diff.length > 20000 ? diff.slice(0, 20000) : diff;
  return (await aiSummariseCommit(clipped)) ?? "";
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
