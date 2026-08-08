import { body } from "express-validator";

// Validation middleware for sending a message
export const sendMessageValidation = [
  // Validate the "message" field
  body("message")
    .isString() // Must be a string
    .notEmpty() // Cannot be an empty string
    .withMessage("Message is required"),

  // Validate the optional "conversationId" field
  body("conversationId")
    .optional() // Validation only runs if the field is provided
    .isString() // Must be a string
    .withMessage("Conversation ID must be a string")
    .isMongoId() // Must be a valid MongoDB ObjectId
    .withMessage("Conversation ID must be a valid MongoDB ID"),
];