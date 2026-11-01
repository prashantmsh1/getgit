import { db } from "@/server/db";

export const indexStatus = {
  QUEUED: "QUEUED",
  SUMMARIZING: "SUMMARIZING",
  EMBEDDING: "EMBEDDING",
  READY: "READY",
  FAILED: "FAILED",
};

export const isQueued = async (projectId: string, totalFiles: number) => {
  await db.indexJob.upsert({
    where: { projectId },
    create: {
      projectId,
      status: "QUEUED",
      totalFiles,
      processedFiles: 0,
    },
    update: {
      status: "QUEUED",
      totalFiles,
      processedFiles: 0,
      errorMessage: null,
    },
  });
};

export const isSummarizing = async (projectId: string) => {
  await db.indexJob.update({
    where: { projectId },
    data: {
      status: "SUMMARIZING",
    },
  });
};

export const isEmbedding = async (projectId: string) => {
  await db.indexJob.update({
    where: { projectId },
    data: {
      status: "EMBEDDING",
    },
  });
};

export const isReady = async (projectId: string) => {
  await db.indexJob.update({
    where: { projectId },
    data: {
      status: "READY",
    },
  });
};

export const isFailed = async (projectId: string, errorMessage: string) => {
  await db.indexJob.update({
    where: { projectId },
    data: {
      status: "FAILED",
      errorMessage: errorMessage,
    },
  });
};
