import { GoogleGenAI } from "@google/genai";

import { Document } from "@langchain/core/documents";

const genAI = new GoogleGenAI({
  vertexai: false,
  apiKey: process.env.GEMINI_API_KEY,
});

const model = genAI.chats.create({
  model: "gemini-2.0-flash",
});

export const aiSummariseCommit = async (diff: string) => {
  const response = await model.sendMessage({
    message: `
    You are an expert programmer, and you are trying to summarize a git diff.
    
    Reminders about the git diff format:
For every file, there are a few metadata lines, like (for example):
'''
diff --git a/lib/index.js b/lib/index.js
index oocf601..bfef603 100644
--- a/lib/index.js
+++ b/lib/index.js
\'\'\'
This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
Then there is a specifier of the lines that were modified.
A line starting with \`+\` means it was added.
A line that starting with \`-\` means that line was deleted.
A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
It is not part of the diff.
[...]

EXAMPLE SUMMARY COMMENTS:
\'\'\'
* Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
* Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
* Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
* Added an OpenAI API for completions [packages/utils/apis/openai.ts]
* Lowered numeric tolerance for test files
\'\'\'
Most commits will have less comments than this examples list.
The last comment does not include the file names.
because there were more than two relevant files in the hypothetical commit.
Do not include parts of the example in your summary.
It is given only as an example of appropriate comments.

Please summarise the following diff file: \n\n${diff} and only return the summary comments as a bulleted list.`,
  });

  return response.text;
};

export const summariseCode = async (doc: Document) => {
  console.log("Summarizing document...", doc.metadata.source);

  const code = doc.pageContent.slice(0, 10000); // Limit to first 3000 characters

  const response = await model.sendMessage({
    message: `
   Imagine you're having a one-on-one with a junior software engineer you're onboarding. Your goal is to make them understand the core purpose of the ${doc.metadata.source} file. Explain it as if you're talking directly to them, using clear language and perhaps drawing analogies if helpful. Ask if they have any initial questions at the end.
    Please provide a concise summary of the following code:
    -----
    \n\n${code}
    
    -----
    
    Give a summary no more than 100 words for the code above.`,
    config: {
      maxOutputTokens: 2000,
    },
  });

  return response.text;
};

export const generateEmbedding = async (text: string) => {
  console.log("Generating embeddings for text of length:", text.length);

  const response = await genAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,

    config: {
      outputDimensionality: 768,
    },
  });

  if (!response.embeddings || response.embeddings.length === 0) {
    console.warn("No embeddings generated in response");
    return [];
  }

  const embedding = response.embeddings[0];
  // console.log("Generated embedding:", JSON.stringify(embedding));
  return embedding?.values;
};

// console.log(
//   await aiSummariseCommit(
//     "diff --git a/lib/index.js b/lib/index.js\nindex oocf601..bfef603 100644\n--- a/lib/index.js\n+++ b/lib/index.js\n@@ -1,4 +1,4 @@\n-console.log('Hello World');\n+console.log('Hello, World!');\n",
//   ),
// );

// console.log(
//   await summariseCode(
//     new Document({
//       pageContent: `function add(a, b) {
//   return a + b;
// }

// console.log(add(2, 3));`,
//       metadata: { source: "example.js" },
//     }),
//   ),
// );

// console.log(
//   await generateEmbeddings("This is a sample text to generate embeddings for."),
// );
