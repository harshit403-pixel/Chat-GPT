import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { RequestMessage } from "../types/chat.js";
import { getConversationTitle, getStream } from "../service/ai.service.js";
import { conversationDao } from "../dao/conversation.dao.js";
import { messageDao } from "../dao/message.dao.js";

// Handles the complete chat flow:
// 1. Authenticate the user
// 2. Create a new conversation (if needed)
// 3. Save the user's message
// 4. Stream the AI response to the client
// 5. Save the AI's response
export const chatController = asyncHandler(
  async (req: Request<{}, {}, RequestMessage>, res: Response) => {
    // Extract message and conversation ID from the request body
    let { message, conversationId } = req.body;

    // Authenticated user added by the auth middleware
    const user = req.user;

    // Reject the request if the user is not authenticated
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // If no conversation ID is provided, create a new conversation
    if (!conversationId) {
      // Generate a short AI title based on the first message
      const title = await getConversationTitle({ message });

      // Store the new conversation in the database
      const newConversation = await conversationDao.createConversation({
        title,
        user: user.userId,
      });

      // Use the newly created conversation ID
      conversationId = newConversation._id.toString();
    }

    // Save the user's message to the database
    await messageDao.createMessage({
      content: message,
      author: "user",
      conversation: conversationId,
    });

    // Generate a streaming AI response
    const stream = await getStream({ message });

    // Configure Server-Sent Events (SSE) headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Collect the complete AI response while streaming it
    let aiMessage = "";

    // Send each generated chunk to the client in real time
    for await (const chunk of stream) {
      res.write(`data: ${chunk.text}\n\n`);

      // Store each chunk so the complete response can be saved later
      aiMessage += chunk.text;
    }

    // Close the SSE connection
    res.end();

    // Save the complete AI response to the database
    await messageDao.createMessage({
      content: aiMessage,
      author: "ai",
      conversation: conversationId,
    });
  }
);