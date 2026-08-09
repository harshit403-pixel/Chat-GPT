import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { RequestMessage } from "../types/chat.js";
import { getConversationTitle, getStream } from "../service/ai.service.js";
import { conversationDao } from "../dao/conversation.dao.js";
import { messageDao } from "../dao/message.dao.js";
import { ApiError } from "../utils/api-error.js";
import { HumanMessage, AIMessage, ToolMessage, AIMessageChunk } from "langchain";

export const listConversations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    const conversations = await conversationDao.findConversationsByUser(user.userId);

    res.status(200).json({
        conversations: conversations.map((conversation) => ({
            id: conversation._id.toString(),
            title: conversation.title,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
        }))
    });
});

export const getConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    const conversation = await conversationDao.findConversationByIdAndUser(
        String(req.params.conversationId),
        user.userId
    );
    if (!conversation) {
        throw new ApiError(404, "Conversation not found");
    }

    const messages = await messageDao.findMessagesByConversation(
  conversation._id.toString()
);

    res.status(200).json({
        conversation: {
            id: conversation._id.toString(),
            title: conversation.title,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messages: messages.map((message) => ({
                id: message._id.toString(),
                author: message.author,
                content: message.content,
                createdAt: message.createdAt
            }))
        }
    });
});

/**
 * POST /api/v1/chat/conversation
 * 
 * req.body = {
 *     message: string,
 *     conversationId?: string
 * }
 */
export const chatController = asyncHandler(async (req: Request<{}, {}, RequestMessage>, res: Response): Promise<void> => {

    let { message, conversationId } = req.body;
    let conversationTitle: string;
    const user = req.user; // Assuming user is attached to the request object after authentication

    if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!conversationId) {
        conversationTitle = await getConversationTitle({ message });
        const newConversation = await conversationDao.createConversation({
            user: user.userId,
            title: conversationTitle,
        })

        conversationId = newConversation._id.toString();
    } else {
        const conversation = await conversationDao.findConversationByIdAndUser(
            conversationId,
            user.userId
        );
        if (!conversation) {
            throw new ApiError(404, "Conversation not found");
        }
        conversationTitle = conversation.title;
    }

    await messageDao.createMessage({
        content: message,
        author: "user",
        conversation: conversationId
    })

    //gettiong the convbo msgs to send in ai ques so that it can remebere prev msgs
    const messages = await messageDao.findMessagesByConversation(conversationId);
    //now we want data like 
    //HumanMessage then AIMessage then HumanMessage

const stream = await getStream({messages, userId:user.userId});

// Configure SSE headers
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

// Send conversation metadata in response headers
res.setHeader("X-Conversation-Id", conversationId);
res.setHeader("X-Conversation-Title", encodeURIComponent(conversationTitle));

let aiMessage = "";

// Stream AI response
for await (const [mode,data] of stream) {

    if(mode==="messages"){

        const [token,metadata] = data
    
    if(token.getType() === "ai"){

  aiMessage += token.text;

  // Send each chunk to the frontend
  res.write(`data: ${JSON.stringify(token.text)}\n\n`);}
} else if(mode==="values"){

    console.log("recieved values", data)

}

}

// Close the stream
res.end();

// Save the complete AI response
await messageDao.createMessage({
  content: aiMessage,
  author: "ai",
  conversation: conversationId,
});});