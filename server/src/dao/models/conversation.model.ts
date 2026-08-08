// Import required Mongoose utilities
import { Schema, model, type InferSchemaType, Types } from "mongoose";


// Define the schema (blueprint) for the Conversation collection
const conversationSchema = new Schema(
  {
    // Title of the conversation
    title: {
      type: String,      // Stored as a string
      required: true,    // Cannot be null or undefined
      trim: true,        // Removes leading and trailing spaces
      minlength: 3,      // Minimum length of 3 characters
    },

    // Reference to the User who owns this conversation
    user: {
      type: Schema.Types.ObjectId, // MongoDB ObjectId
      ref: "User",                 // References the User collection
      required: true,              // Every conversation must belong to a user
      index: true,                 // Creates an index for faster queries
    },
  },
  {
    // Automatically adds:
    // createdAt
    // updatedAt
    timestamps: true,
  }
);

// Generate a TypeScript type from the schema.
// InferSchemaType extracts all schema fields automatically.
//
// '&' merges another type into it.
// We manually add '_id' because MongoDB automatically creates it,
// but InferSchemaType doesn't include it by default.
export type ConversationDocument =
  InferSchemaType<typeof conversationSchema> & {
    _id: Types.ObjectId;
  };

// Create and export the Mongoose model.
// This model is used to perform CRUD operations on the "conversations" collection.
export const ConversationModel = model(
  "Conversation",
  conversationSchema
);