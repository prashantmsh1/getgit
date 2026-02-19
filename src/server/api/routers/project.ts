import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pullCommits } from "@/lib/github";

import { indexGitHubRepo } from "@/lib/github-loader";

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
});
