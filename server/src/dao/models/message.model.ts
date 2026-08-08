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
        enum:["user","ai"],
        defaul:"user"

    },
    content:{
        type:String,
        required:true,
        trim:true,
        minlength:1
    }

},{
    timestamps:true
})

export type messageDocument = InferSchemaType<typeof messageSchema>&{
    _id: Types.ObjectId
}

export const MessageModel = model("Message", messageSchema)