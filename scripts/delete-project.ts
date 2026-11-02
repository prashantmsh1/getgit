/**
 * Delete one project and every row that belongs to it.
 *
 * Usage (from the repo root):
 *   bun scripts/delete-project.ts <project-uuid>
 */
import { PrismaClient } from "@prisma/client";
import { deleteProjectById } from "./delete-project-data";
import { loadEnvFile } from "./load-env";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const deleted = await prisma.$transaction(
      async (tx) => {
        const project = await tx.project.findUnique({
          where: { id: projectId },
          select: { id: true, name: true, githubUrl: true },
        });

        if (!project) {
          return null;
        }

        const counts = await deleteProjectById(tx, projectId);

        return { project, ...counts };
      },
      {
        maxWait: 20_000,
        timeout: 10 * 60 * 1000,
      },
    );

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
    console.log(`  index jobs: ${deleted.indexJobs}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
