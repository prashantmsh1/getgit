import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pullCommits } from "@/lib/github";

import { checkCredits, indexGitHubRepo } from "@/lib/github-loader";
import { ChartScatter } from "lucide-react";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      console.log("Input received:", input);
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          githubUrl: input.githubUrl,
          githubToken: input.githubToken!,
          UserToProject: { create: { userId: ctx.user.userId } },
        },
      });
      console.log("Project created:", project);
      await indexGitHubRepo(
        project.id,
        input.githubUrl,
        input.githubToken ?? undefined,
      );
      await pullCommits(project.id);
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
        Commit: true,
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
      pullCommits(input.projectId)
        .then(() => {
          console.log("Pull commits completed for project:", input.projectId);
        })
        .catch((error) => {
          console.error(
            "Error pulling commits for project:",
            input.projectId,
            error,
          );
        });
      const commits = await ctx.db.commit.findMany({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          createdAt: "desc",
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

  checkCredits: protectedProcedure
    .input(
      z.object({
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const fileCount = await checkCredits(input.githubUrl, input.githubToken);
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
