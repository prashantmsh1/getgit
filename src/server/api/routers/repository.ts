import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { resolveGithubToken } from "@/lib/github-token";
import { TRPCError } from "@trpc/server";
import { getBranches } from "@/lib/repository";
export const repositoryRouter = createTRPCRouter({
  getBranches: protectedProcedure
    .input(
      z.object({
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: {
          id: ctx.user.userId,
        },
        select: {
          credits: true,
        },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const githubToken = await resolveGithubToken(
        ctx.user.userId,
        input.githubToken,
      );

      try {
        return await getBranches(input.githubUrl, githubToken);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to get branches";
        throw new TRPCError({
          code:
            message === "GitHub token not found"
              ? "UNAUTHORIZED"
              : "BAD_REQUEST",
          message,
        });
      }
    }),
});
