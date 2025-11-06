import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { db } from "@/server/db";

import type { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
interface EmbeddingResult {
  summary: string;
  embedding: number[];
  sourceCode: string;
  fileName: string;
}
export const loadGitHubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  const repoUrl = githubUrl.endsWith(".git")
    ? githubUrl.slice(0, -4)
    : githubUrl;
  const loader = new GithubRepoLoader(repoUrl, {
    accessToken: githubToken ?? process.env.GITHUB_TOKEN,

    branch: "main",
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
) => {
  const docs = await loadGitHubRepo(githubUrl, githubToken);

  const allEmbeddings = await generateEmbeddings(docs);

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
