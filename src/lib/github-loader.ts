import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";

export const loadGitHubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken || "",
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

console.log(await loadGitHubRepo);
