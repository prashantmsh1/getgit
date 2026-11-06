// src/server/workers/incrementalSync.ts
import { db } from "@/server/db";
import { Octokit } from "octokit";
import { generateEmbedding, summariseCode } from "@/lib/gemini";
import { computeRepoDiff } from "@/lib/git-diff";

export async function runIncrementalSync(
  projectId: string,
  owner: string,
  repo: string,
  branch = "main",
  githubToken?: string,
) {
  const octokit = new Octokit({
    auth: githubToken ?? process.env.GITHUB_TOKEN,
  });

  const diff = await computeRepoDiff(projectId, owner, repo, branch, octokit);

  // 1. Immediately drop deleted files
  if (diff.toDelete.length > 0) {
    await db.sourceCodeEmbedding.deleteMany({
      where: {
        projectId,
        fileName: { in: diff.toDelete },
      },
    });
  }

  if (diff.toAddOrUpdate.length === 0) {
    // Repository files are unchanged, update timestamp and exit
    await db.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });
    return { modified: 0, deleted: diff.toDelete.length };
  }

  // 2. Process modified and added files in batches
  const BATCH_SIZE = 5;
  for (let i = 0; i < diff.toAddOrUpdate.length; i += BATCH_SIZE) {
    const batch = diff.toAddOrUpdate.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async ({ fileName, blobSha }) => {
        // Fetch raw file content via blob SHA
        const { data: blobData } = await octokit.rest.git.getBlob({
          owner,
          repo,
          file_sha: blobSha,
        });

        const rawCode = Buffer.from(blobData.content, "base64").toString(
          "utf-8",
        );

        const summary = await summariseCode({
          pageContent: rawCode,
          metadata: { source: fileName },
        });

        if (!summary) {
          throw new Error(`Failed to summarize ${fileName}`);
        }

        const embeddingVector = await generateEmbedding(summary);
        if (!embeddingVector) {
          throw new Error(`Failed to embed summary for ${fileName}`);
        }

        // Upsert into SourceCodeEmbedding
        const record = await db.sourceCodeEmbedding.upsert({
          where: {
            projectId_fileName: {
              projectId,
              fileName,
            },
          },
          create: {
            projectId,
            fileName,
            blobSha,
            commitSha: diff.headCommitSha,
            sourceCode: rawCode,
            summary,
          },
          update: {
            blobSha,
            commitSha: diff.headCommitSha,
            sourceCode: rawCode,
            summary,
          },
        });

        // Store vector embedding using raw SQL
        await db.$executeRaw`
          UPDATE "SourceCodeEmbedding"
          SET "summaryEmbedding" = ${embeddingVector}::vector
          WHERE "id" = ${record.id}
        `;
      }),
    );
  }

  // 3. Update project timestamp
  await db.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });

  return {
    modified: diff.toAddOrUpdate.length,
    deleted: diff.toDelete.length,
  };
}
