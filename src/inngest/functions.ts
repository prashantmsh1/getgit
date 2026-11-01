// src/inngest/functions.ts
import { indexGitHubRepo } from "@/lib/github-loader";
import { inngest } from "./client"; //
import { indexRepository } from "@/lib/repo-index";

export const indexProjectFunction = inngest.createFunction(
  //[cite: 1]
  {
    id: "index-project-repo", //[cite: 1]
    retries: 2, //[cite: 1]
    triggers: [{ event: "project/index.requested" }], //[cite: 1]
  },
  async ({ event, step }) => {
    //[cite: 1]
    const { projectId, githubUrl, githubToken, branch } = event.data; //[cite: 1]

    // step.run gives this task its own execution window and automatic retries
    await step.run("summarize-and-embed-repo", async () => {
      //[cite: 1]
      await indexRepository(projectId, githubUrl, githubToken, branch); //[cite: 1]
    });
  },
);
