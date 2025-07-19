const express = require("express");
const {
  summaryController,
  paragraphController,
  jsconverterController,
  scifiImageController,
  createChatSession,
  getChatSessions,
  getChatMessages,
  chatController,
  continueChat,
  exportChat,
  deleteChatSession,
} = require("../controllers/openiaController");

const router = express.Router();

// New chat routes
router.post("/chat/session", createChatSession);
router.get("/chat/sessions", getChatSessions);
router.get("/chat/messages/:sessionId", getChatMessages);
router.post("/chat", chatController);
router.post("/chat/continue", continueChat);
router.get("/chat/export/:sessionId", exportChat);
router.delete("/chat/session/:sessionId", deleteChatSession);

// Legacy routes for backward compatibility
router.post("/summary", summaryController);
router.post("/paragraph", paragraphController);
router.post("/chatbot", chatController); // Updated to use new chat controller
router.post("/js-converter", jsconverterController);
router.post("/scifi-image", scifiImageController);

module.exports = router;