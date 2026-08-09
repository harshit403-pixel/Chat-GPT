export type RequestMessage = {
    message: string;
    conversationId?: string;
}

export type Message = {
    author: "user" | "ai" 
    content: string;
    conversation: string;
    toolCalls?: {
        arguments?: Record<string, unknown>;
        id?: string | null;
        name?: string | null;
    }[];
    toolCallId?: string | null;
}

//this is basically the upgraded versiopn of message that comes from mongo after saving both human and ai amesdsagfe in convo 
export type MongoMessage = Message & {
    _id: string;
    createdAt: Date;
    updatedAt: Date;

}