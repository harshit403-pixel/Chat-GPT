import { Schema, model, type InferSchemaType, Types } from "mongoose";

const messageSchema = new Schema({
    conversation:{
        type:Schema.Types.ObjectId,
        required:true,
        index:true,
        ref:"Conversation"
    },
    author:{
        type:String,
        enum:["user","ai","tool"],
        defaul:"user",
        required:true

    },
    content:{
        type:String,
        required:true,
        trim:true,
        minlength:1
    },
    toolCalls:[
        {
            arguments:Object,
            id:String,
            name:String

        }
    
    ],
    toolCallId:String


},{
    timestamps:true
})

export type MessageDocument = InferSchemaType<typeof messageSchema>&{
    _id: Types.ObjectId
}

export const MessageModel = model("Message", messageSchema)