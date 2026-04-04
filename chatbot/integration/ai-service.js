/* ============================================================
   PRECISION POS — AI INTEGRATION MODULE
   ============================================================
   This service handles communication with any AI model using 
   the standard OpenAI Chat Completions API format (supported by
   OpenAI, Groq, Anthropic wrappers, and local models like LMStudio)
   ============================================================ */

// 1. READ YOUR API KEY FROM .ENV (via Electron's preload bridge)
// Ensure you have added CHATBOT_API_KEY="..." to the actual .env file in the root directory.
const API_KEY = window.env?.CHATBOT_API_KEY || "YOUR_API_KEY_HERE";

// 2. CONFIGURE YOUR MODEL ENDPOINT (Read from .env or fallback to defaults)
const AI_CONFIG = {
  ENDPOINT: window.env?.ENDPOINT || "https://api.openai.com/v1/chat/completions",
  MODEL: window.env?.MODEL || "gpt-4o",
  
  // INSTRUCTIONS: Define how the bot should talk and behave
  SYSTEM_PROMPT: `You are Precision AI, a helpful and professional assistant integrated directly into a Point of Sale (POS) and Inventory Management system. 
You provide concise, accurate, and direct answers to help users manage stock, track sales, and navigate the application.`
};

/**
 * Sends the chat history to the configured AI API and retrieves the response.
 * @param {Array} history - Array of message objects {role: "user" | "assistant", content: "..."}
 * @returns {Promise<string>} - The AI's response text
 */
async function generateAIResponse(history) {
  // Construct the payload holding instructions and conversation context
  const messagesPayload = [
    { role: "system", content: AI_CONFIG.SYSTEM_PROMPT },
    // Map our internal format to the standardized AI API format
    ...history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }))
  ];

  try {
    const response = await fetch(AI_CONFIG.ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Optional Bearer token authorization (Only required for remote APIs)
        ...(API_KEY && API_KEY !== 'YOUR_API_KEY_HERE' ? { 'Authorization': `Bearer ${API_KEY}` } : {})
      },
      body: JSON.stringify({
        model: AI_CONFIG.MODEL,
        messages: messagesPayload,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("AI Integration Error:", error);
    return `⚠️ Connection Error: ${error.message}`;
  }
}

// Attach the service globally so chatbot.js can utilize it!
window.PrecisionAI = {
  generateResponse: generateAIResponse,
  config: AI_CONFIG
};
