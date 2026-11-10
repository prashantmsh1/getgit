import { indexGitHubRepo } from "@/lib/github-loader";
import { pullCommits } from "./github";
import { isFailed, isReady } from "@/utils/dbUtils/indexStatus";

export const indexRepository = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
  branch?: string,
) => {
  try {
    await indexGitHubRepo(projectId, githubUrl, githubToken, branch);

    try {
      await pullCommits(projectId, githubToken);
    } catch (commitError) {
      console.warn(
        "Commits could not be pulled during indexing (repository code is indexed):",
        commitError instanceof Error ? commitError.message : commitError,
      );
      // Ensure the project transitions to READY since code files are successfully indexed
      await isReady(projectId);
    }
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
