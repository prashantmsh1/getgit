// src/lib/github-diff.ts
import { Octokit } from "octokit";
import { db } from "@/server/db";

interface TreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export interface RepoDiff {
  headCommitSha: string;
  toAddOrUpdate: Array<{ fileName: string; blobSha: string }>;
  toDelete: string[];
  unchangedCount: number;
}

const IGNORED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".pdf",
  ".lock",
  "-lock.json",
  ".bin",
  ".zip",
  ".tar.gz",
  ".map",
];

export async function computeRepoDiff(
  projectId: string,
  owner: string,
  repo: string,
  branch = "main",
  octokit: Octokit,
): Promise<RepoDiff> {
  // 1. Get current HEAD commit SHA
  const { data: refData } = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch,
  });
  const headCommitSha = refData.commit.sha;

  // 2. Fetch entire Git Tree (1 API call returns all file paths and blob SHAs)
  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: headCommitSha,
    recursive: "1",
  });

  const gitFiles = (treeData.tree as TreeItem[]).filter(
    (item) =>
      item.type === "blob" &&
      !IGNORED_EXTENSIONS.some((ext) => item.path.endsWith(ext)),
  );

  // 3. Fetch all currently stored embeddings for this project
  const storedEmbeddings = await db.sourceCodeEmbedding.findMany({
    where: { projectId },
    select: { fileName: true, blobSha: true },
  });

  const storedMap = new Map(
    storedEmbeddings.map((item) => [item.fileName, item.blobSha]),
  );
  const gitPaths = new Set(gitFiles.map((f) => f.path));

  const toAddOrUpdate: Array<{ fileName: string; blobSha: string }> = [];
  let unchangedCount = 0;

  for (const file of gitFiles) {
    const existingBlobSha = storedMap.get(file.path);

    if (!existingBlobSha || existingBlobSha !== file.sha) {
      // New file or modified content
      toAddOrUpdate.push({ fileName: file.path, blobSha: file.sha });
    } else {
      unchangedCount++;
    }
  }

  // Files in DB that no longer exist in the repo tree
  const toDelete = storedEmbeddings
    .filter((e) => !gitPaths.has(e.fileName))
    .map((e) => e.fileName);

  return {
    headCommitSha,
    toAddOrUpdate,
    toDelete,
    unchangedCount,
  };
}
