import { indexGitHubRepo } from "@/lib/github-loader";
import { pullCommits } from "./github";
import { isFailed } from "@/utils/dbUtils/indexStatus";

export const indexRepository = async (
  projectId: string,
  githubUrl: string,
  githubToken: string,
  branch: string,
) => {
  try {
    await indexGitHubRepo(projectId, githubUrl, githubToken, branch);
    await pullCommits(projectId, githubToken);
  } catch (error) {
    console.error("Project indexing failed:", projectId, error);
    await isFailed(
      projectId,
      error instanceof Error ? error.message : "Project indexing failed",
    );
  }
};
