import { db } from "@/server/db";
// import { db } from "../server/db";
import axios from "axios";
import { Octokit } from "octokit";
import { aiSummariseCommit } from "./gemini";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

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
): Promise<Response[]> => {
  // Extract owner and repo from the GitHub URL

  console.log("GitHub URL:", githubUrl);
  const [owner, repo] = githubUrl.split("/").slice(-2);

  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL");
  }

  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    per_page: 15,
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

export const pullCommits = async (projectId: string) => {
  const { projects, githubUrl } = await fetchProjectGithubUrl(projectId);

  const commitHashes = await getCommitHashes(githubUrl);

  const unprocessedCommits = await filterUnprocessedCommits(
    commitHashes,
    projectId,
  );

  const summaryResponses = await Promise.allSettled(
    unprocessedCommits.map(async (commit) => {
      const summary = await summariseCommits(githubUrl, commit.commitHash);

      return summary;
      // Save the commit and its summary to the database
    }),
  );

  const summarise = summaryResponses.map((response) => {
    if (response.status === "fulfilled") {
      return response.value;
    }
    return "";
  });

  console.log("Summarised Commits:", summarise);

  const commit = await db.commit.createMany({
    data: summarise.map((summary, index) => {
      return {
        projectId: projectId,
        commitHash: unprocessedCommits[index]!.commitHash,
        commitMessage: unprocessedCommits[index]!.commitMessage,
        commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
        commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
        commitDate: unprocessedCommits[index]!.commitDate,

        summary: summary,
      };
    }),
  });

  console.log("Unprocessed Commits:", unprocessedCommits);
};

async function summariseCommits(githubUrl: string, commitHash: string) {
  const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
    headers: {
      Accept: "application/vnd.github.v3.diff",
    },
    responseType: "text",
  });

  return await aiSummariseCommit(String(data));
}

export const fetchProjectGithubUrl = async (projectId: string) => {
  // Fetch project details from your database or API

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      githubUrl: true,
    },
  });
  return { projects: project, githubUrl: project?.githubUrl ?? "" };
};

async function filterUnprocessedCommits(
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
      commitHash: true,
    },
  });

  const existingCommitHashes = new Set(
    existingCommits.map((commit) => commit.commitHash),
  );

  return commitHashes.filter(
    (commit) => !existingCommitHashes.has(commit.commitHash),
  );
}

// Example usage
// (async () => {
// })();

// console.log(await getCommitHashes(githubUrl));

// console.log("88888888888", pullCommits("9946338b-7514-4efc-b005-b7203cce331e"));
