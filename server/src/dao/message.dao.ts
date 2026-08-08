import type { Message } from "../types/chat.js";
import { MessageModel , type MessageDocument } from "./models/message.model.js";


class MessageDao{

    async createMessage(messageData:Message):Promise<MessageDocument>{

        const {content , author, conversation} = messageData

        const message = await MessageModel.create({content, author, conversation})

        return message
    }

}

export const messageDao = new MessageDao();