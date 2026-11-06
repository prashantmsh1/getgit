import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { db } from "@/server/db";

import type { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { Octokit } from "octokit";
import {
  isEmbedding,
  isFailed,
  isSummarizing,
} from "@/utils/dbUtils/indexStatus";
interface EmbeddingResult {
  summary: string;
  embedding: number[];
  sourceCode: string;
  fileName: string;
}

const getFileCount = async (
  path: string,
  octokit: Octokit,
  githubOwner: string,
  githubRepo: string,
  acc = 0,
  branch?: string,
) => {
  const { data } = await octokit.rest.repos.getContent({
    owner: githubOwner,
    repo: githubRepo,
    path: path,
    ...(branch ? { ref: branch } : {}),
  });

  if (!Array.isArray(data) && data.type === "file") {
    return acc + 1;
  }

  if (Array.isArray(data)) {
    let fileCount = 0;
    const directories: string[] = [];

    for (const item of data) {
      if (item.type === "file") {
        fileCount++;
      } else if (item.type === "dir") {
        directories.push(item.path);
      }
    }

    if (directories.length > 0) {
      const directoryCounts = await Promise.all(
        directories.map((dirPath) =>
          getFileCount(dirPath, octokit, githubOwner, githubRepo, 0, branch),
        ),
      );
      fileCount += directoryCounts.reduce((acc, count) => acc + count, 0) ?? 0;
    }

    return acc + fileCount;
  }

  return acc;
};

export const checkCredits = async (
  githubUrl: string,
  githubToken?: string,
  branch?: string,
) => {
  const octokit = new Octokit({ auth: githubToken });

  const repoUrl = githubUrl.endsWith(".git")
    ? githubUrl.slice(0, -4)
    : githubUrl;

  const githubOwner = repoUrl.split("/")[3];
  const githubRepo = repoUrl.split("/")[4];

  if (!githubOwner || !githubRepo) {
    return 0;
  }

  const fileCount = await getFileCount(
    "",
    octokit,
    githubOwner,
    githubRepo,
    0,
    branch,
  );

  return fileCount;
};

async function getBranchHeadCommitSha(
  githubUrl: string,
  githubToken?: string,
  branch?: string,
): Promise<string> {
  const octokit = new Octokit({
    auth: githubToken ?? process.env.GITHUB_TOKEN,
  });
  const repoUrl = githubUrl.endsWith(".git")
    ? githubUrl.slice(0, -4)
    : githubUrl;
  const githubOwner = repoUrl.split("/")[3];
  const githubRepo = repoUrl.split("/")[4];
  if (!githubOwner || !githubRepo) {
    return "";
  }

  const resolvedBranch =
    branch ??
    (
      await octokit.rest.repos.get({
        owner: githubOwner,
        repo: githubRepo,
      })
    ).data.default_branch;

  const { data } = await octokit.rest.repos.getBranch({
    owner: githubOwner,
    repo: githubRepo,
    branch: resolvedBranch,
  });

  return data.commit.sha;
}

export const loadGitHubRepo = async (
  githubUrl: string,
  githubToken?: string,
  branch?: string,
) => {
  if (!githubUrl) {
    throw new Error("githubUrl is required to load a repository");
  }

  const repoUrl = githubUrl.endsWith(".git")
    ? githubUrl.slice(0, -4)
    : githubUrl;
  const loader = new GithubRepoLoader(repoUrl, {
    accessToken: githubToken ?? process.env.GITHUB_TOKEN,
    ...(branch ? { branch } : {}),
    ignoreFiles: [
      "**/node_modules/**",
      "**/.git/**",
      "package-lock.json",
      "**/.next/**",
      "yarn.lock",
      "pnpm-lock.yaml",
      "bun.lock.yaml",
      "bun.lockb",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });
  const docs = await loader.load();

  return docs;
};

export const indexGitHubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
  branch?: string,
) => {
  if (!projectId || !githubUrl) {
    throw new Error(
      "projectId and githubUrl are required to index a repository",
    );
  }

  await db.sourceCodeEmbedding.deleteMany({ where: { projectId } });

  let docs;
  try {
    docs = await loadGitHubRepo(githubUrl, githubToken, branch);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load repository";
    await isFailed(projectId, message);
    throw error;
  }

  if (docs.length === 0) {
    await isFailed(projectId, "No indexable files found in this branch.");
    throw new Error("No indexable files found in this branch.");
  }

  await isSummarizing(projectId);
  const allEmbeddings = await generateEmbeddings(docs);
  if (allEmbeddings.length === 0) {
    await isFailed(
      projectId,
      "Could not summarize any files. Check your API keys and try again.",
    );
    throw new Error("Could not summarize any files.");
  }

  await isEmbedding(projectId);

  const commitSha = await getBranchHeadCommitSha(
    githubUrl,
    githubToken,
    branch,
  );

  await Promise.allSettled(
    allEmbeddings.map(async (embedding, index) => {
      // Do something with each embedding
      console.log(`processing ${index + 1} of ${allEmbeddings.length}`);
      if (!embedding) return;

      try {
        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
          data: {
            fileName: embedding.fileName,
            summary: embedding.summary ?? "",
            sourceCode: embedding.sourceCode,
            projectId: projectId,
            blobSha: "",
            commitSha,
          },
        });

        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding"= ${embedding.embedding}::vector
        WHERE id = ${sourceCodeEmbedding.id}
      `;
      } catch (error) {
        console.error(
          `Error creating embedding for ${embedding.fileName}:`,
          error,
        );
      }
    }),
  );
};

export const generateEmbeddings = async (docs: Document[]) => {
  const results = await Promise.allSettled(
    docs.map(async (doc) => {
      try {
        // Skip files exceeding a reasonable token limit (e.g., ~30,000 chars as a proxy for tokens)
        const content = doc.pageContent;
        if (content.length > 30000) {
          console.warn(
            `Skipping large file: ${doc.metadata.source} (length: ${content.length})`,
          );
          return null;
        }

        const summary = await summariseCode(doc);
        if (!summary) {
          console.warn(`Failed to summarize: ${doc.metadata.source}`);
          return null;
        }

        const embedding = await generateEmbedding(summary);
        if (!embedding) {
          console.warn(
            `Failed to generate embedding for: ${doc.metadata.source}`,
          );
          return null;
        }

        return {
          summary,
          embedding,
          sourceCode: JSON.stringify(content),
          fileName: doc.metadata.source as string,
        };
      } catch (error) {
        console.error(`Error processing ${doc.metadata.source}:`, error);
        return null;
      }
    }),
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<EmbeddingResult> =>
        result.status === "fulfilled" && result.value !== null,
    )
    .map((result) => result.value);
};

// console.log(
//   await loadGitHubRepo("https://github.com/prashantmsh1/getgit.git", ""),
// );
