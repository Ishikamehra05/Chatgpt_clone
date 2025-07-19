const dotenv = require("dotenv");
const OpenAI = require("openai");
const { v4: uuidv4 } = require("uuid");
const { ChatSession, ChatMessage } = require("../models/chatModel");
const ErrorResponse = require("../utils/errorResponse");
const { callOpenAI, getErrorMessage, rateLimiter } = require("../utils/openaiHelper");

dotenv.config();

// Initialize OpenAI with new API
let openai = null;

// Check if OpenAI API key is configured
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-goes-here') {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI API configured successfully');
  } catch (error) {
    console.error('❌ OpenAI initialization error:', error.message);
  }
} else {
  console.warn('⚠️  OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.');
  console.warn('📖 See README.md for instructions on how to get an API key.');
}

// Create new chat session
exports.createChatSession = async (req, res, next) => {
  try {
    const { userId } = req.user || { userId: "anonymous" };
    const sessionId = uuidv4();
    
    console.log('Creating chat session with userId:', userId, 'sessionId:', sessionId);
    
    const chatSession = new ChatSession({
      userId,
      sessionId,
      title: "New Chat",
    });

    await chatSession.save();
    console.log('✅ Chat session created successfully:', chatSession._id);

    res.status(201).json({
      success: true,
      data: {
        sessionId: chatSession.sessionId,
        title: chatSession.title,
        createdAt: chatSession.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error creating chat session:', error);
    next(new ErrorResponse(`Failed to create chat session: ${error.message}`, 500));
  }
};

// Get all chat sessions for a user
exports.getChatSessions = async (req, res, next) => {
  try {
    const { userId } = req.user || { userId: "anonymous" };
    
    const sessions = await ChatSession.find({ userId })
      .sort({ updatedAt: -1 })
      .select("sessionId title createdAt updatedAt messageCount totalTokens");

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error('❌ Error fetching chat sessions:', error);
    next(new ErrorResponse("Failed to fetch chat sessions", 500));
  }
};

// Get messages for a specific session
exports.getChatMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const messages = await ChatMessage.find({ sessionId })
      .sort({ timestamp: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    next(new ErrorResponse("Failed to fetch chat messages", 500));
  }
};

// Main chat controller with conversation history and rate limiting
exports.chatController = async (req, res, next) => {
  try {
    const { message, sessionId, model = "gpt-3.5-turbo", temperature = 0.7 } = req.body;
    const userId = req.user?.userId || "anonymous";

    console.log('📨 Received chat request:', { message: message?.substring(0, 50) + '...', sessionId, userId });

    if (!message) {
      return next(new ErrorResponse("Message is required", 400));
    }

    if (!sessionId) {
      return next(new ErrorResponse("Session ID is required", 400));
    }

    // Check rate limit
    if (!rateLimiter.isAllowed(userId)) {
      const resetTime = rateLimiter.getTimeUntilReset(userId);
      return next(new ErrorResponse(`Rate limit exceeded. Please wait ${resetTime} seconds before trying again.`, 429));
    }

    // Verify session exists
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return next(new ErrorResponse("Chat session not found", 404));
    }

    // Save user message first
    const userMessage = new ChatMessage({
      sessionId,
      role: "user",
      content: message,
    });
    await userMessage.save();
    console.log('✅ User message saved');

    // Check if OpenAI is configured
    if (!openai) {
      console.log('OpenAI not configured, using fallback response');
      
      const fallbackResponse = `I'm a demo ChatGPT clone, but I need an OpenAI API key to provide real AI responses. 

Your message: "${message}"

To enable real AI responses:
1. Get an API key from https://platform.openai.com/api-keys
2. Add it to your .env file: OPENAI_API_KEY=your-key-here
3. Restart the server

For now, I can echo your messages and help you test the interface!`;

      const assistantMessage = new ChatMessage({
        sessionId,
        role: "assistant",
        content: fallbackResponse,
        tokens: 0,
        model: "demo-mode",
      });
      await assistantMessage.save();

      await ChatSession.findOneAndUpdate(
        { sessionId },
        { 
          updatedAt: new Date(),
          ...(session.title === "New Chat" && { 
            title: message.length > 50 ? message.substring(0, 50) + "..." : message 
          })
        }
      );

      return res.status(200).json({
        success: true,
        data: {
          message: fallbackResponse,
          tokens: 0,
          model: "demo-mode",
          sessionId,
          timestamp: assistantMessage.timestamp,
          rateLimitInfo: {
            remaining: rateLimiter.getRemainingRequests(userId),
            resetTime: rateLimiter.getTimeUntilReset(userId)
          }
        },
      });
    }

    // Get conversation history
    const previousMessages = await ChatMessage.find({ sessionId })
      .sort({ timestamp: 1 })
      .limit(20);

    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant. Provide clear, accurate, and helpful responses."
      },
      ...previousMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    console.log('🤖 Calling OpenAI API with rate limiting...');

    // Call OpenAI API with rate limiting and retry logic
    const completion = await callOpenAI(openai, async () => {
      return await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: 1000,
        stream: false,
      });
    }, userId);

    const assistantResponse = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;

    console.log('OpenAI response received, tokens used:', tokensUsed);

    // Save assistant response
    const assistantMessage = new ChatMessage({
      sessionId,
      role: "assistant",
      content: assistantResponse,
      tokens: tokensUsed,
      model,
    });
    await assistantMessage.save();

    // Update session with token usage
    await ChatSession.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { totalTokens: tokensUsed },
        updatedAt: new Date(),
        ...(session.title === "New Chat" && { 
          title: message.length > 50 ? message.substring(0, 50) + "..." : message 
        })
      }
    );

    res.status(200).json({
      success: true,
      data: {
        message: assistantResponse,
        tokens: tokensUsed,
        model,
        sessionId,
        timestamp: assistantMessage.timestamp,
        rateLimitInfo: {
          remaining: rateLimiter.getRemainingRequests(userId),
          resetTime: rateLimiter.getTimeUntilReset(userId)
        }
      },
    });

  } catch (error) {
    console.error("Chat error:", error);
    
    const errorMessage = getErrorMessage(error);
    const statusCode = error.status === 429 ? 429 : 500;
    
    next(new ErrorResponse(errorMessage, statusCode));
  }
};

// Continue incomplete response
exports.continueChat = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.userId || "anonymous";

    if (!openai) {
      return next(new ErrorResponse("OpenAI API not configured. Please set your API key.", 500));
    }

    if (!sessionId) {
      return next(new ErrorResponse("Session ID is required", 400));
    }

    // Check rate limit
    if (!rateLimiter.isAllowed(userId)) {
      const resetTime = rateLimiter.getTimeUntilReset(userId);
      return next(new ErrorResponse(`Rate limit exceeded. Please wait ${resetTime} seconds before trying again.`, 429));
    }

    const lastMessage = await ChatMessage.findOne({ 
      sessionId, 
      role: "assistant" 
    }).sort({ timestamp: -1 });

    if (!lastMessage) {
      return next(new ErrorResponse("No previous message to continue", 404));
    }

    const previousMessages = await ChatMessage.find({ sessionId })
      .sort({ timestamp: 1 })
      .limit(20);

    const messages = [
      {
        role: "system",
        content: "Continue your previous response. Pick up exactly where you left off."
      },
      ...previousMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: "Please continue your previous response."
      }
    ];

    const completion = await callOpenAI(openai, async () => {
      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });
    }, userId);

    const continuedResponse = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;

    const assistantMessage = new ChatMessage({
      sessionId,
      role: "assistant",
      content: continuedResponse,
      tokens: tokensUsed,
      model: "gpt-3.5-turbo",
    });
    await assistantMessage.save();

    await ChatSession.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { totalTokens: tokensUsed },
        updatedAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      data: {
        message: continuedResponse,
        tokens: tokensUsed,
        sessionId,
        timestamp: assistantMessage.timestamp,
        rateLimitInfo: {
          remaining: rateLimiter.getRemainingRequests(userId),
          resetTime: rateLimiter.getTimeUntilReset(userId)
        }
      },
    });

  } catch (error) {
    console.error("Continue chat error:", error);
    const errorMessage = getErrorMessage(error);
    next(new ErrorResponse(errorMessage, error.status === 429 ? 429 : 500));
  }
};

// Export chat session
exports.exportChat = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { format = "json" } = req.query;

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return next(new ErrorResponse("Chat session not found", 404));
    }

    const messages = await ChatMessage.find({ sessionId })
      .sort({ timestamp: 1 });

    const exportData = {
      session: {
        id: session.sessionId,
        title: session.title,
        createdAt: session.createdAt,
        totalTokens: session.totalTokens,
        messageCount: session.messageCount,
      },
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        tokens: msg.tokens,
      })),
    };

    if (format === "txt") {
      let textContent = `Chat Export: ${session.title}\n`;
      textContent += `Created: ${session.createdAt}\n`;
      textContent += `Total Tokens: ${session.totalTokens}\n\n`;
      
      messages.forEach(msg => {
        textContent += `[${msg.role.toUpperCase()}] ${msg.timestamp}\n`;
        textContent += `${msg.content}\n\n`;
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="chat-${sessionId}.txt"`);
      return res.send(textContent);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chat-${sessionId}.json"`);
    res.status(200).json(exportData);

  } catch (error) {
    console.error('Export error:', error);
    next(new ErrorResponse("Failed to export chat", 500));
  }
};

// Delete chat session
exports.deleteChatSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    await ChatMessage.deleteMany({ sessionId });
    const session = await ChatSession.findOneAndDelete({ sessionId });
    
    if (!session) {
      return next(new ErrorResponse("Chat session not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Chat session deleted successfully",
    });

  } catch (error) {
    console.error('Delete session error:', error);
    next(new ErrorResponse("Failed to delete chat session", 500));
  }
};

// Legacy controllers with rate limiting
exports.summaryController = async (req, res, next) => {
  try {
    const { text } = req.body;
    const userId = req.user?.userId || "anonymous";

    if (!openai) {
      return next(new ErrorResponse("OpenAI API not configured. Please set your API key.", 500));
    }

    if (!rateLimiter.isAllowed(userId)) {
      const resetTime = rateLimiter.getTimeUntilReset(userId);
      return next(new ErrorResponse(`Rate limit exceeded. Please wait ${resetTime} seconds before trying again.`, 429));
    }
    
    const completion = await callOpenAI(openai, async () => {
      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise summaries."
          },
          {
            role: "user",
            content: `Please summarize the following text:\n\n${text}`
          }
        ],
        max_tokens: 500,
        temperature: 0.5,
      });
    }, userId);

    res.status(200).json({
      success: true,
      data: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Summary error:', error);
    const errorMessage = getErrorMessage(error);
    next(new ErrorResponse(errorMessage, error.status === 429 ? 429 : 500));
  }
};

exports.paragraphController = async (req, res, next) => {
  try {
    const { text } = req.body;
    const userId = req.user?.userId || "anonymous";

    if (!openai) {
      return next(new ErrorResponse("OpenAI API not configured. Please set your API key.", 500));
    }

    if (!rateLimiter.isAllowed(userId)) {
      const resetTime = rateLimiter.getTimeUntilReset(userId);
      return next(new ErrorResponse(`Rate limit exceeded. Please wait ${resetTime} seconds before trying again.`, 429));
    }
    
    const completion = await callOpenAI(openai, async () => {
      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Write a detailed paragraph about: ${text}`
          }
        ],
        max_tokens: 500,
        temperature: 0.5,
      });
    }, userId);

    res.status(200).json({
      success: true,
      data: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Paragraph error:', error);
    const errorMessage = getErrorMessage(error);
    next(new ErrorResponse(errorMessage, error.status === 429 ? 429 : 500));
  }
};

exports.jsconverterController = async (req, res, next) => {
  try {
    const { text } = req.body;
    const userId = req.user?.userId || "anonymous";

    if (!openai) {
      return next(new ErrorResponse("OpenAI API not configured. Please set your API key.", 500));
    }

    if (!rateLimiter.isAllowed(userId)) {
      const resetTime = rateLimiter.getTimeUntilReset(userId);
      return next(new ErrorResponse(`Rate limit exceeded. Please wait ${resetTime} seconds before trying again.`, 429));
    }
    
    const completion = await callOpenAI(openai, async () => {
      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that converts instructions into JavaScript code."
          },
          {
            role: "user",
            content: `Convert these instructions into JavaScript code:\n${text}`
          }
        ],
        max_tokens: 400,
        temperature: 0.25,
      });
    }, userId);

    res.status(200).json({
      success: true,
      data: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('JS converter error:', error);
    const errorMessage = getErrorMessage(error);
    next(new ErrorResponse(errorMessage, error.status === 429 ? 429 : 500));
  }
};

exports.scifiImageController = async (req, res, next) => {
  try {
    const { text } = req.body;
    const userId = req.user?.userId || "anonymous";

    if (!openai) {
      return next(new ErrorResponse("OpenAI API not configured. Please set your API key.", 500));
    }

    if (!rateLimiter.isAllowed(userId)) {
      const resetTime = rateLimiter.getTimeUntilReset(userId);
      return next(new ErrorResponse(`Rate limit exceeded. Please wait ${resetTime} seconds before trying again.`, 429));
    }
    
    const response = await callOpenAI(openai, async () => {
      return await openai.images.generate({
        model: "dall-e-2",
        prompt: `Generate a sci-fi image of ${text}`,
        n: 1,
        size: "512x512",
      });
    }, userId);

    res.status(200).json({
      success: true,
      data: response.data[0].url,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    const errorMessage = getErrorMessage(error);
    next(new ErrorResponse(errorMessage, error.status === 429 ? 429 : 500));
  }
};