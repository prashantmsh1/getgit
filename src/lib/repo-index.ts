import { indexGitHubRepo } from "@/lib/github-loader";
import { pullCommits } from "./github";
import { isFailed } from "@/utils/dbUtils/indexStatus";

export const indexRepository = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
  branch?: string,
) => {
  try {
    await indexGitHubRepo(projectId, githubUrl, githubToken, branch);
    await pullCommits(projectId, githubToken);
  } catch (error) {
    console.error("Project indexing failed:", projectId, error);
    const message =
      error instanceof Error ? error.message : "Project indexing failed";
    if (projectId) {
      try {
        await isFailed(projectId, message.slice(0, 500));
      } catch (statusError) {
        console.error(
          "Failed to mark index job as failed:",
          projectId,
          statusError,
        );
      }
    }
    throw error;
  }
};
