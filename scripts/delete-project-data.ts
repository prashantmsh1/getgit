import type { Prisma } from "@prisma/client";

export type ProjectDeleteCounts = {
  issues: number;
  meetings: number;
  questions: number;
  commits: number;
  embeddings: number;
  members: number;
  indexJobs: number;
};

export async function deleteProjectById(
  tx: Prisma.TransactionClient,
  projectId: string,
): Promise<ProjectDeleteCounts> {
  const meetings = await tx.meeting.findMany({
    where: { projectId },
    select: { id: true },
  });
  const meetingIds = meetings.map((meeting) => meeting.id);

  const issues =
    meetingIds.length === 0
      ? { count: 0 }
      : await tx.issue.deleteMany({
          where: { meetingId: { in: meetingIds } },
        });

  const meetingsDeleted = await tx.meeting.deleteMany({ where: { projectId } });
  const questions = await tx.question.deleteMany({ where: { projectId } });
  const commits = await tx.commit.deleteMany({ where: { projectId } });
  const embeddings = await tx.sourceCodeEmbedding.deleteMany({
    where: { projectId },
  });
  const members = await tx.userToProject.deleteMany({ where: { projectId } });
  const indexJobs = await tx.indexJob.deleteMany({ where: { projectId } });

  await tx.project.delete({ where: { id: projectId } });

  return {
    issues: issues.count,
    meetings: meetingsDeleted.count,
    questions: questions.count,
    commits: commits.count,
    embeddings: embeddings.count,
    members: members.count,
    indexJobs: indexJobs.count,
  };
}

export function sumDeleteCounts(
  totals: ProjectDeleteCounts,
  next: ProjectDeleteCounts,
): ProjectDeleteCounts {
  return {
    issues: totals.issues + next.issues,
    meetings: totals.meetings + next.meetings,
    questions: totals.questions + next.questions,
    commits: totals.commits + next.commits,
    embeddings: totals.embeddings + next.embeddings,
    members: totals.members + next.members,
    indexJobs: totals.indexJobs + next.indexJobs,
  };
}

export const emptyDeleteCounts = (): ProjectDeleteCounts => ({
  issues: 0,
  meetings: 0,
  questions: 0,
  commits: 0,
  embeddings: 0,
  members: 0,
  indexJobs: 0,
});
