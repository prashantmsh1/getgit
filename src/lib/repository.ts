import { createOctokit } from "./github";

function parseGithubRepo(githubUrl: string) {
  const cleaned = githubUrl
    .trim()
    .replace(/\.git$/, "")
    .replace(/\/+$/, "");
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (!match?.[1] || !match[2]) {
    throw new Error("Invalid GitHub URL");
  }
  return { owner: match[1], repo: match[2] };
}

export const getBranches = async (githubUrl: string, githubToken?: string) => {
  if (!githubToken) {
    throw new Error("GitHub token not found");
  }
  const { owner, repo } = parseGithubRepo(githubUrl);
  const octokit = createOctokit(githubToken);
  const [{ data: repository }, branches] = await Promise.all([
    octokit.rest.repos.get({ owner, repo }),
    octokit.paginate(octokit.rest.repos.listBranches, {
      owner,
      repo,
      per_page: 100,
    }),
  ]);

  return {
    branches: branches.map((branch) => branch.name),
    defaultBranch: repository.default_branch,
  };
};
