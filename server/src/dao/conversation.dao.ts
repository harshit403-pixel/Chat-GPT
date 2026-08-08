import { ConversationModel, type ConversationDocument } from "./models/conversation.model.js";

class ConversationDao{

async createConversation(input:{title:string, user:string}):Promise <ConversationDocument> {
  const conversation = await   ConversationModel.create(input)
    return conversation
    
}

}

export const conversationDao = new ConversationDao();