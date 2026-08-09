import { ChatMistralAI } from "@langchain/mistralai";
import { env } from "../config/env.js";
import { AIMessage, createAgent, HumanMessage } from "langchain";
import * as z from "zod";
import { MongoMessage } from "../types/chat.js";
import { getMemoryTool, getWebResultTool, updateMemoryTool } from "./ai/tools.js";


// Small Mistral model used for lightweight tasks like title generation
const smallModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: env.mistralApiKey,
});

const mediumModel = new ChatMistralAI({
    model:"mistral-medium-latest"
})

// Generates a concise title for a conversation based on the first message
export async function getConversationTitle({
  message,
}: {
  message: string;
}): Promise<string> {
  // Create an AI agent with structured output
  const agent = createAgent({
    model: smallModel,

    // Force the model to return a JSON object with a single "title" field
    responseFormat: z.object({
      title: z
        .string()
        .max(30)
        .describe("A short, descriptive title for the conversation"),
    }),

    // Instructions given to the AI before every request
    systemPrompt: `
You are an AI assistant that generates concise conversation titles.

Rules:
- Generate a clear and meaningful title based on the user's message.
- Keep the title under 30 characters.
- Use 2–5 words whenever possible.
- Do not use quotation marks.
- Do not include emojis.
- Do not end with punctuation.
- Return only the title in the required JSON format.
- If the message is vague, generate the best descriptive title possible.
`,
  });

  // Send the user's first message to the agent
  const response = await agent.invoke({
    messages: [
     new HumanMessage(message)
    ],
  });

  // Return the generated title
  return response.structuredResponse.title;
} 

export async function getStream({messages , userId}:{messages:MongoMessage[], userId:string}):Promise<ReadableStream>
    {
const agent = createAgent({
  model: mediumModel,
  tools: [getMemoryTool, updateMemoryTool, getWebResultTool],
systemPrompt: `
You are a helpful AI assistant.

Current date: ${new Date().toISOString().split("T")[0]}
User ID: ${userId}

Memory:
- Use getMemory when existing user context can help personalize the response.
- Use updateMemory when the user shares information likely to remain relevant for weeks or months, such as preferences, goals, habits, or ongoing projects.
- Do not save temporary or trivial information.
- Preserve useful existing context when updating memory.

Web:
- Use getWebResult for current, recent, factual, or web-based information.
- Do not use web search when you can answer reliably without it.

Always prioritize the user's request and use tools only when useful.
`,
});
        


const stream = await agent.stream(
    {
      messages: messages.map((message) => {
        if (message.author === "user") {
          return new HumanMessage(message.content);
        }

        return new AIMessage(message.content);
      }),
    },
    {
      configurable: {
        userId,
      },
      streamMode: ["messages","values"],
    }
  );

  return stream;
}

