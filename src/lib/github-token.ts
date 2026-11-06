import { clerkClient } from "@clerk/nextjs/server";

/**
 * Retrieves the GitHub OAuth access token for a given Clerk user.
 * Tries both "github" and "oauth_github" provider identifiers.
 */
export async function getClerkGithubToken(
  userId: string,
): Promise<string | null> {
  try {
    const client = await clerkClient();

    // Clerk supports "github" (and legacy "oauth_github")
    const res = await client.users.getUserOauthAccessToken(userId, "github");
    const token = res.data?.[0]?.token;

    if (token) {
      return token;
    }

    // Fallback attempt with "oauth_github"
    const fallbackRes = await client.users.getUserOauthAccessToken(
      userId,
      "oauth_github",
    );
    return fallbackRes.data?.[0]?.token ?? null;
  } catch (error) {
    console.warn(
      "Could not retrieve GitHub OAuth token from Clerk for user:",
      userId,
      error,
    );
    return null;
  }
}

/**
 * Checks if the user has a connected GitHub account in Clerk.
 */
export async function hasClerkGithubConnected(
  userId: string,
): Promise<boolean> {
  try {
    const token = await getClerkGithubToken(userId);
    return Boolean(token);
  } catch {
    return false;
  }
}

/**
 * Token used for GitHub API calls.
 * A pasted personal access token wins, then the user's Clerk GitHub
 * OAuth token, then the server GITHUB_TOKEN.
 */
export async function resolveGithubToken(
  userId: string,
  explicitToken?: string | null,
): Promise<string | undefined> {
  const pasted = explicitToken?.trim();
  if (pasted) {
    return pasted;
  }

  const clerkToken = await getClerkGithubToken(userId);
  if (clerkToken) {
    return clerkToken;
  }

  const envToken = process.env.GITHUB_TOKEN?.trim();
  return envToken || undefined;
}
