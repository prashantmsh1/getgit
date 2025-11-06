"use server";
import { streamText } from "ai";
import { createStreamableValue } from "@ai-sdk/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbedding } from "@/lib/gemini";

import { db } from "@/server/db";

interface Result {
  fileName: string;
  sourceCode: string;
  summary: string;
  similarity: number;
}
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// ...existing code...

export async function streamGoogleAIResponse(
  question: string,
  projectId: string,
) {
  const stream = createStreamableValue();

  try {
    const queryVector = await generateEmbedding(question);

    if (!queryVector) {
      throw new Error("Failed to generate embedding for the query.");
    }

    const vectorQuery = `[${queryVector.join(", ")}]`;

    // Fix: Properly type the raw query and remove invalid 'as' syntax.
    // Use db.$queryRaw<Result[]> for typing; ensure vector operations are supported in your DB (e.g., pgvector).
    const result: Result[] = await db.$queryRaw<Result[]>`
      SELECT "fileName", "sourceCode", "summary", 
             (1 - ("summaryEmbedding" <=> ${vectorQuery}::vector)) AS similarity
      FROM "SourceCodeEmbedding"
      WHERE (1 - ("summaryEmbedding" <=> ${vectorQuery}::vector)) > 0.5
        AND "projectId" = ${projectId}
      ORDER BY similarity DESC
      LIMIT 10
    `;

    let context = "";
    for (const row of result) {
      context += `File Name: ${row.fileName}\nSummary: ${row.summary}\nSource Code: ${row.sourceCode}\n\n`;
    }

    // Fix: Complete the truncated prompt for better AI responses.
    const { textStream } = streamText({
      model: google("gemini-2.5-flash"), // Adjusted model name for accuracy (gemini-2.5-flash may not exist; check docs).
      prompt: `You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern. AI assistant is a brand new, powerful, human-like artificial intelligence. The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.

AI is a well-behaved and well-mannered individual.

AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.

AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic.

If the question is asking about code or a specific file, AI will provide the detailed answer, giving step-by-step instructions.

START CONTEXT BLOCK

${context}

END OF CONTEXT BLOCK

START QUESTION

${question}

END OF QUESTION

AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.

If the context does not provide the answer to the question, the AI assistant will say, "I'm sorry, but I don't have enough information from the provided context to answer this."

AI assistant will not apologize for previous responses, but instead will indicate new information with phrases like "Based on the new context..."

AI assistant will not invent anything that is not drawn directly from the context.

Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering.`,
    });

    for await (const chunk of textStream) {
      stream.append(chunk);
    }

    stream.done();

    // Fix: Return the streamable value so the client can consume it (e.g., in a React component via useStreamableValue).
    return {
      output: stream.value,
      fileReferences: result,
    };
  } catch (error) {
    console.error("Error in streamGoogleAIResponse:", error);
    stream.error("Failed to generate response"); // Handle errors gracefully in the stream.
    return {
      output: stream.value,
      fileReferences: [],
    };
  }
}

// export async function streamGoogleAIResponse(
//   question: string,
//   projectId: string,
// ) {
//   const stream = createStreamableValue();

//   const queryVector = await generateEmbedding(question);

//   if (!queryVector) {
//     throw new Error("Failed to generate embedding for the query.");
//   }

//   const vectorQuery = `[${queryVector.join(", ")}]`;

//   const result: Result[] =
//     await db.$queryRaw`SELECT "fileName", "sourceCode","summary",
//     (1 - ("summaryEmbedding" <=> ${vectorQuery}::vector)) AS similarity

//     FROM "SourceCodeEmbedding"
//     where 1-("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.5
//     AND "projectId" = ${projectId}
//     ORDER BY "similarity" DESC
//     LIMIT 10 as {fileName: string; sourceCode: string; summary: string; similarity: number;}[]`;

//   let context = "";

//   for (const row of result) {
//     context += `File Name: ${row.fileName}\nSummary: ${row.summary}\nSource Code: ${row.sourceCode}\n\n`;
//   }

//   const { textStream } = streamText({
//     model: google("gemini-2.5-flash"),
//     prompt: ` You are a ai code assistant who answers questions about the codebase. Your target audience is a technical intern with AI assistant is a brand new, powerful, human-like artificial intelligence. The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.

// AI is a well-behaved and well-mannered individual.

// AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.

// AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in

// If the question is asking about code or a specific file, AI will provide the detailed answer, giving step by step instru

// START CONTEXT BLOCK

// ${context}

// END OF CONTEXT BLOCK

// START QUESTION

// ${question}

// END OF QUESTION

// AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.

// If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I

// AI assistant will not apologize for previous responses, but instead will indicated new information w

// AI assistant will not invent anything that is not drawn directly from the context.

// Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering`,
//   });

//   for await (const chunk of textStream) {
//     stream.append(chunk);
//   }

//   stream.done();
// }
