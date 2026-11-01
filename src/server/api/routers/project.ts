import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pullCommits } from "@/lib/github";
import { resolveGithubToken } from "@/lib/github-token";

import { checkCredits, indexGitHubRepo } from "@/lib/github-loader";
import { ChartScatter } from "lucide-react";
import { isFailed, isQueued } from "@/utils/dbUtils/indexStatus";

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

      await ctx.db.user.update({
        where: {
          id: ctx.user.userId,
        },
        data: {
          credits: {
            decrement: fileCount,
          },
        },
      });

      void (async () => {
        try {
          await indexGitHubRepo(
            project.id,
            input.githubUrl,
            githubToken,
            input.branch,
          );
          await pullCommits(project.id, githubToken);
        } catch (error) {
          console.error("Project indexing failed:", project.id, error);
          await isFailed(
            project.id,
            error instanceof Error ? error.message : "Project indexing failed",
          );
        }
      })();

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

  getMyCredits: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.user.userId,
      },
    });
    return user;
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
});
