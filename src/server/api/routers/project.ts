import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pullCommits } from "@/lib/github";
import { resolveGithubToken } from "@/lib/github-token";

import { checkCredits } from "@/lib/github-loader";
import { isFailed, isQueued } from "@/utils/dbUtils/indexStatus";
import { inngest } from "@/inngest/client";
import { TRPCError } from "@trpc/server";
import { computeRepoDiff } from "@/lib/github-diff";
import { Octokit } from "octokit";

const CREDITS_PER_FILE = 1;

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
        branch: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: {
          id: ctx.user.userId,
        },
        select: {
          credits: true,
        },
      });
      if (!user) {
        throw new Error("User not found");
      }

      const currentCredits = user.credits;
      const pastedToken = input.githubToken?.trim() || undefined;
      const githubToken = await resolveGithubToken(
        ctx.user.userId,
        pastedToken,
      );
      const fileCount = await checkCredits(
        input.githubUrl,
        githubToken,
        input.branch,
      );
      if (currentCredits < fileCount) {
        throw new Error(
          "You don't have enough credits to create this project.",
        );
      }

      console.log("Input received:", input);
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          githubUrl: input.githubUrl,
          branch: input.branch,
          githubToken: pastedToken ?? null,
          UserToProject: { create: { userId: ctx.user.userId } },
        },
      });
      console.log("Project created:", project);
      await isQueued(project.id, fileCount);

      try {
        await inngest.send({
          name: "project/index.requested",
          data: {
            projectId: project.id,
            githubUrl: input.githubUrl,
            githubToken: githubToken,
            branch: input.branch,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to queue indexing";
        await isFailed(project.id, message);
        throw new Error(`Could not start indexing: ${message}`);
      }

      await ctx.db.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: {
            id: ctx.user.userId,
          },
          data: {
            credits: {
              decrement: fileCount,
            },
          },
          select: { credits: true },
        });
        await tx.creditLedgerEntry.create({
          data: {
            userId: ctx.user.userId,
            kind: "PROJECT_INDEX",
            amount: -fileCount,
            balanceAfter: updated.credits,
            title: `Initial index: ${input.name}`,
            detail: `${fileCount} credit${fileCount === 1 ? "" : "s"} used to index files in this repository.`,
            projectId: project.id,
          },
        });
      });

      return project;
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: {
        UserToProject: {
          some: {
            userId: ctx.user.userId,
          },
        },
        deletedAt: null,
      },
      include: {
        Commit: {
          orderBy: {
            commitDate: "desc",
          },
        },
      },
    });
    return projects;
  }),

  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { githubToken: true },
      });
      const githubToken = await resolveGithubToken(
        ctx.user.userId,
        project?.githubToken,
      );
      await pullCommits(input.projectId, githubToken);
      const commits = await ctx.db.commit.findMany({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          commitDate: "desc",
        },
      });
      return commits;
    }),

  saveAnswer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        question: z.string(),
        fileReferences: z.any(),
        answer: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const answer = await ctx.db.question.create({
        data: {
          projectId: input.projectId,
          question: input.question,
          answer: input.answer,
          userId: ctx.user.userId,
          fileReferences: input.fileReferences,
        },
      });
      return answer;
    }),

  getQuestions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const questions = await ctx.db.question.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return questions;
    }),

  uploadMeeting: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        meetingUrl: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const meeting = await ctx.db.meeting.create({
        data: {
          projectId: input.projectId,
          meetingUrl: input.meetingUrl,
          name: input.name,
        },
      });

      return meeting;
    }),

  getMeetings: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const meetings = await ctx.db.meeting.findMany({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          issues: true,
          project: true,
        },
      });
      return meetings;
    }),

  deletedMeetings: protectedProcedure
    .input(
      z.object({
        meetingId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const meeting = await ctx.db.meeting.delete({
        where: {
          id: input.meetingId,
        },
      });
      return meeting;
    }),

  getMeetingById: protectedProcedure
    .input(
      z.object({
        meetingId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: {
          id: input.meetingId,
        },
        include: {
          issues: true,
          project: true,
        },
      });
      return meeting;
    }),

  archiveProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.db.project.update({
        where: {
          id: input.projectId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
      return project;
    }),

  getTeamMembers: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const teamMembers = await ctx.db.userToProject.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
      });
      return teamMembers;
    }),

  /** Current balance plus recent credit activity for billing. */
  getBillingOverview: protectedProcedure.query(async ({ ctx }) => {
    const [user, entries] = await Promise.all([
      ctx.db.user.findUnique({
        where: { id: ctx.user.userId },
        select: { credits: true },
      }),
      ctx.db.creditLedgerEntry.findMany({
        where: { userId: ctx.user.userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          createdAt: true,
          kind: true,
          amount: true,
          balanceAfter: true,
          title: true,
          detail: true,
        },
      }),
    ]);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      credits: user.credits,
      entries,
    };
  }),

  getIndexStatus: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const job = await ctx.db.indexJob.findFirst({
        where: {
          projectId: input.projectId,
          project: {
            UserToProject: {
              some: { userId: ctx.user.userId },
            },
          },
        },
        select: {
          status: true,
          totalFiles: true,
          processedFiles: true,
          errorMessage: true,
          updatedAt: true,
        },
      });
      return job;
    }),

  checkCredits: protectedProcedure
    .input(
      z.object({
        githubUrl: z.string(),
        githubToken: z.string().optional(),
        branch: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const githubToken = await resolveGithubToken(
        ctx.user.userId,
        input.githubToken,
      );
      const fileCount = await checkCredits(
        input.githubUrl,
        githubToken,
        input.branch,
      );
      const userCredits = await ctx.db.user.findUnique({
        where: {
          id: ctx.user.userId,
        },
        select: {
          credits: true,
        },
      });

      return { fileCount, userCredits: userCredits?.credits ?? 0 };
    }),

  // Pre-flight check for the UI to display the exact charge to the user
  getSyncQuote: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirstOrThrow({
        where: {
          id: input.projectId,
          UserToProject: {
            some: {
              userId: ctx.user.userId,
            },
          },
        },
      });

      const [owner, repo] = parseOwnerAndRepo(project.githubUrl);
      const token = await resolveGithubToken(
        ctx.user.userId,
        project.githubToken ?? undefined,
      );
      const octokit = new Octokit({ auth: token || process.env.GITHUB_TOKEN });
      const branch = project.branch || "main";

      const diff = await computeRepoDiff(
        project.id,
        owner,
        repo,
        branch,
        octokit,
      );
      const creditCost = diff.toAddOrUpdate.length * CREDITS_PER_FILE;

      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.user.userId },
        select: { credits: true },
      });

      return {
        filesToUpdate: diff.toAddOrUpdate.length,
        filesToDelete: diff.toDelete.length,
        unchangedCount: diff.unchangedCount,
        creditCost,
        userCredits: user.credits,
        canAfford: user.credits >= creditCost,
      };
    }),

  // Execute sync and charge the delta
  syncProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirstOrThrow({
        where: {
          id: input.projectId,
          UserToProject: {
            some: {
              userId: ctx.user.userId,
            },
          },
        },
      });

      const [owner, repo] = parseOwnerAndRepo(project.githubUrl);
      const token = await resolveGithubToken(
        ctx.user.userId,
        project.githubToken ?? undefined,
      );
      const octokit = new Octokit({ auth: token || process.env.GITHUB_TOKEN });
      const branch = project.branch || "main";
      const diff = await computeRepoDiff(
        project.id,
        owner,
        repo,
        branch,
        octokit,
      );

      const creditCost = diff.toAddOrUpdate.length * CREDITS_PER_FILE;

      // Atomic credit verification and deduction
      await ctx.db.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({
          where: { id: ctx.user.userId },
        });

        if (user.credits < creditCost) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient credits. Need ${creditCost}, have ${user.credits}.`,
          });
        }

        if (creditCost > 0) {
          const updated = await tx.user.update({
            where: { id: ctx.user.userId },
            data: { credits: { decrement: creditCost } },
            select: { credits: true },
          });
          await tx.creditLedgerEntry.create({
            data: {
              userId: ctx.user.userId,
              kind: "REPO_SYNC",
              amount: -creditCost,
              balanceAfter: updated.credits,
              title: `Repository sync: ${project.name}`,
              detail: `${creditCost} credit${creditCost === 1 ? "" : "s"} used to index changed files.`,
              projectId: project.id,
            },
          });
        }
      });

      // Dispatch to background queue
      await inngest.send({
        name: "project/sync.requested",
        data: {
          projectId: project.id,
          owner,
          repo,
          branch,
          githubToken: token,
        },
      });

      return {
        message: "Sync started",
        chargedCredits: creditCost,
        changedFiles: diff.toAddOrUpdate.length,
      };
    }),
});

function parseOwnerAndRepo(githubUrl: string): [string, string] {
  const parts = githubUrl.replace(/\/+$/, "").replace(/\.git$/, "").split("/");
  return [parts[parts.length - 2]!, parts[parts.length - 1]!];
}
