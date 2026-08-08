export type RequestMessage = {
    message:string,
    conversationId?:string
}

export type Message = {
    author:"user"| "ai",
    content :string,
    conversation:string
}