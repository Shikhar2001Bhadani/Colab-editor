import axios from 'axios';
import config from '../config/index.js';

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${config.geminiApiKey}`;

// Rate limiting setup
const rateLimiter = {
  tokens: 10, // Maximum requests per time window
  lastRefill: Date.now(),
  refillRate: 1000, // Refill one token every 1000ms (1 second)
  maxTokens: 10,
};

// Refill tokens based on time passed
const refillTokens = () => {
  const now = Date.now();
  const timePassed = now - rateLimiter.lastRefill;
  const tokensToAdd = Math.floor(timePassed / rateLimiter.refillRate);
  
  if (tokensToAdd > 0) {
    rateLimiter.tokens = Math.min(rateLimiter.maxTokens, rateLimiter.tokens + tokensToAdd);
    rateLimiter.lastRefill = now - (timePassed % rateLimiter.refillRate);
  }
};

// Check if we can make a request
const canMakeRequest = () => {
  refillTokens();
  if (rateLimiter.tokens > 0) {
    rateLimiter.tokens--;
    return true;
  }
  return false;
};

export const getGeminiResponse = async (prompt) => {
  if (!config.geminiApiKey) {
    console.error('Gemini API key is not configured.');
    throw new Error('Gemini API key is not configured.');
  }
  
  try {
    // Check rate limit before making request
    if (!canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again in a few seconds.');
    }

    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 256,
        stopSequences: []
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    console.log('Sending request to Gemini API with prompt:', prompt.substring(0, 100) + '...');
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 seconds timeout
    });

    if (response.data.candidates && response.data.candidates[0]?.content?.parts[0]?.text) {
      let result = response.data.candidates[0].content.parts[0].text.trim();
      
      // Clean up the response
      result = result.replace(/^["']|["']$/g, '').trim();
      
      // If the response is empty or too short, try again
      if (result.length < 3) {
        console.warn('Received empty or too short response, trying again...');
        return getGeminiResponse(prompt);
      }
      
      console.log('Gemini API success, response:', result);
      return result;
    }
    
    throw new Error('No valid response from AI service');
    
  } catch (error) {
    console.error('Gemini API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Handle different error types
    if (error.response?.status === 429) {
      throw new Error('Service is busy. Please wait a moment and try again.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid request. Please try with different text.');
    } else {
      throw new Error('Failed to get response from AI. Please try again.');
    }
  }
};