import { ChatMistralAI } from "@langchain/mistralai";
import { env } from "../config/env.js";
import { createAgent, HumanMessage } from "langchain";
import * as z from "zod";


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

export async function getStream({message}:{message:string}):Promise<ReadableStream>
    {
        
        const stream = await mediumModel.stream(message)
        return stream
    }

