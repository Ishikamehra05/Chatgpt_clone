const express = require("express");
const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully",
    timestamp: new Date().toISOString(),
    environment: process.env.DEV_MODE || "production",
  });
});

// OpenAI configuration check
router.get("/openai-status", (req, res) => {
  const hasApiKey = process.env.OPENAI_API_KEY && 
                   process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-goes-here';
  
  res.status(200).json({
    success: true,
    openaiConfigured: hasApiKey,
    message: hasApiKey 
      ? "OpenAI API key is configured" 
      : "OpenAI API key needs to be set in .env file",
  });
});

// Database connection check
router.get("/db-status", async (req, res) => {
  const mongoose = require("mongoose");
  
  res.status(200).json({
    success: true,
    database: {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
  });
});

module.exports = router;