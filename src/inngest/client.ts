import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "getgit",
  isDev: process.env.NODE_ENV !== "production",
});
