const mongoose = require("mongoose");

// Chat Session Schema
const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: "anonymous",
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    default: "New Chat",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  totalTokens: {
    type: Number,
    default: 0,
  },
  messageCount: {
    type: Number,
    default: 0,
  },
});

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  tokens: {
    type: Number,
    default: 0,
  },
  model: {
    type: String,
    default: "gpt-3.5-turbo",
  },
  isComplete: {
    type: Boolean,
    default: true,
  },
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

// Update session timestamp on message save
chatMessageSchema.pre("save", async function (next) {
  try {
    await ChatSession.findOneAndUpdate(
      { sessionId: this.sessionId },
      { 
        updatedAt: new Date(),
        $inc: { messageCount: 1 }
      }
    );
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = { ChatSession, ChatMessage };