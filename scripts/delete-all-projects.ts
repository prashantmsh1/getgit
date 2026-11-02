/**
 * Delete every project and all related rows (meetings, issues, Q&A, commits,
 * embeddings, index jobs, project memberships). Users and billing rows are kept.
 *
 * Usage (from the repo root):
 *   bun scripts/delete-all-projects.ts --yes
 */
import { PrismaClient } from "@prisma/client";
import {
  deleteProjectById,
  emptyDeleteCounts,
  sumDeleteCounts,
} from "./delete-project-data";
import { loadEnvFile } from "./load-env";

function hasConfirmFlag(args: string[]) {
  return args.includes("--yes") || args.includes("-y");
}

async function main() {
  if (!hasConfirmFlag(process.argv.slice(2))) {
    console.error(
      "This permanently deletes ALL projects and related data.\n" +
        "Re-run with --yes to confirm:\n" +
        "  bun scripts/delete-all-projects.ts --yes",
    );
    process.exit(1);
  }

  loadEnvFile();

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const projects = await tx.project.findMany({
          select: { id: true, name: true, githubUrl: true },
          orderBy: { createdAt: "asc" },
        });

        if (projects.length === 0) {
          return { projects: [], totals: emptyDeleteCounts() };
        }

        let totals = emptyDeleteCounts();

        for (const project of projects) {
          const counts = await deleteProjectById(tx, project.id);
          totals = sumDeleteCounts(totals, counts);
        }

        return { projects, totals };
      },
      {
        maxWait: 20_000,
        timeout: 30 * 60 * 1000,
      },
    );

    if (result.projects.length === 0) {
      console.log("No projects in the database.");
      return;
    }

    console.log(`Deleted ${result.projects.length} project(s):`);
    for (const project of result.projects) {
      console.log(`  - ${project.name} (${project.id})`);
    }

    console.log("Related rows removed:");
    console.log(`  issues: ${result.totals.issues}`);
    console.log(`  meetings: ${result.totals.meetings}`);
    console.log(`  questions: ${result.totals.questions}`);
    console.log(`  commits: ${result.totals.commits}`);
    console.log(`  embeddings: ${result.totals.embeddings}`);
    console.log(`  members: ${result.totals.members}`);
    console.log(`  index jobs: ${result.totals.indexJobs}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
