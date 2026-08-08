import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { RequestMessage } from "../types/chat.js";
import { getConversationTitle, getStream } from "../service/ai.service.js";
import { conversationDao } from "../dao/conversation.dao.js";
import { messageDao } from "../dao/message.dao.js";

export const chatController = asyncHandler( async (req: Request<{},{},RequestMessage>, res: Response) => {

    let {message, conversationId}= req.body
    const user = req.user
    console.log(user)

if (!user) {
  res.status(401).json({ error: "unauthorized" });
  return;
}

    if(!conversationId){
        //convo create karne ke liye user and title chaiye user oth milgya now we need titie;

        const title = await getConversationTitle({message})
        const newConversation = await conversationDao.createConversation({
  title,
  user: user.userId,
});

conversationId = newConversation._id.toString()

    }

   await messageDao.createMessage({
    content:message,
    author:"user",
    conversation:conversationId
   })



    const stream = await getStream({ message });

res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

let aiMessage:string = ""
for await (const chunk of stream) {
  res.write(`data: ${chunk.text}\n\n`);

  aiMessage += chunk.text
}


res.end();

await messageDao.createMessage({
    content:aiMessage,
    author:"ai",
    conversation:conversationId
})

})
