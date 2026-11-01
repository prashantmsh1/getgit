/**
 * Delete one project and every row that belongs to it.
 *
 * Usage (from the repo root):
 *   bun scripts/delete-project.ts <project-uuid>
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function loadEnvFile() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const text = readFileSync(resolve(root, ".env"), "utf8");

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  const projectId = process.argv[2]?.trim();

  if (!projectId || !UUID_RE.test(projectId)) {
    console.error("Usage: bun scripts/delete-project.ts <project-uuid>");
    process.exit(1);
  }

  loadEnvFile();

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, githubUrl: true },
      });

      if (!project) {
        return null;
      }

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

      const meetingsDeleted = await tx.meeting.deleteMany({
        where: { projectId },
      });
      const questions = await tx.question.deleteMany({ where: { projectId } });
      const commits = await tx.commit.deleteMany({ where: { projectId } });
      const embeddings = await tx.sourceCodeEmbedding.deleteMany({
        where: { projectId },
      });
      const members = await tx.userToProject.deleteMany({
        where: { projectId },
      });

      await tx.project.delete({ where: { id: projectId } });

      return {
        project,
        issues: issues.count,
        meetings: meetingsDeleted.count,
        questions: questions.count,
        commits: commits.count,
        embeddings: embeddings.count,
        members: members.count,
      };
    }, {
      maxWait: 20_000,
      timeout: 10 * 60 * 1000,
    });

    if (!deleted) {
      console.error(`No project found for ${projectId}`);
      process.exit(1);
    }

    console.log(`Deleted project "${deleted.project.name}" (${deleted.project.id})`);
    console.log(`  githubUrl: ${deleted.project.githubUrl}`);
    console.log(`  issues: ${deleted.issues}`);
    console.log(`  meetings: ${deleted.meetings}`);
    console.log(`  questions: ${deleted.questions}`);
    console.log(`  commits: ${deleted.commits}`);
    console.log(`  embeddings: ${deleted.embeddings}`);
    console.log(`  members: ${deleted.members}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
