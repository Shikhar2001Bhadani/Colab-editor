import asyncHandler from 'express-async-handler';
import { getGeminiResponse } from '../services/aiService.js';

const checkGrammar = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400);
    throw new Error('Text is required for grammar check');
  }
  const prompt = `Please correct the grammar and spelling of the following text. Only return the corrected text, without any explanation or preamble:\n\n"${text}"`;
  const result = await getGeminiResponse(prompt);
  res.json({ suggestion: result });
});

const enhanceText = asyncHandler(async (req, res) => {
  const { text, tone } = req.body;
  if (!text) {
    res.status(400);
    throw new Error('Text is required for enhancement');
  }
  const prompt = `Rewrite the following text to be more clear, concise, and engaging, adopting a ${tone || 'professional'} tone. Only return the enhanced text:\n\n"${text}"`;
  const result = await getGeminiResponse(prompt);
  res.json({ suggestion: result });
});

const summarizeText = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400);
    throw new Error('Text is required for summarization');
  }
  const prompt = `Summarize the following text into a few key points. Return only the summary:\n\n"${text}"`;
  const result = await getGeminiResponse(prompt);
  res.json({ summary: result });
});

const autoCompleteText = asyncHandler(async (req, res) => {
  try {
    console.log('Auto-complete request received:', { 
      body: req.body,
      params: req.params,
      query: req.query 
    });

    const { text, prefix, context, fullParagraph } = req.body;
    
    if (!text) {
      console.error('No text provided for auto-completion');
      return res.status(400).json({ 
        success: false,
        message: 'Partial text is required for auto-completion' 
      });
    }

    // Clean and prepare the inputs
    const cleanWord = (text || '').toString().trim();
    const cleanPrefix = (prefix || '').toString().trim();
    const cleanContext = (context || '').toString().trim();
    
    if (!cleanWord) {
      console.error('Empty text after trimming');
      return res.status(400).json({
        success: false,
        message: 'Text cannot be empty after trimming'
      });
    }

    // Build a more focused prompt for completion
    const prompt = `Complete this partial text naturally, maintaining the same style and context.
    
    Previous text: "${cleanPrefix}"
    Broader context: "${cleanContext}"
    Partial word/text to complete: "${cleanWord}"
    
    Rules:
    1. Consider the previous text as the start of the sentence/phrase
    2. The partial word/text "${cleanWord}" is what the user is currently typing
    3. Complete it to form a natural continuation of the previous text
    4. Maintain the same tone and style as the context
    5. If it's a question, complete as a question
    6. If it's a statement, complete as a statement
    7. The completion should merge smoothly with the partial word
    8. DO NOT repeat the partial word in your completion
    
    Example:
    If previous text is "Where do you" and partial word is "li", complete with "ve" or "ve now?" etc.
    
    Provide ONLY the completion that would naturally follow the partial text, nothing else.
    Do not include the partial text in your response.`;
    
    console.log('Sending focused prompt to Gemini:', prompt);
    
    const result = await getGeminiResponse(prompt);
    
    if (!result || typeof result !== 'string') {
      throw new Error('Invalid response from AI service');
    }

    const completion = result.trim();
    console.log('Received completion:', completion);
    
    res.json({ 
      success: true,
      original: cleanText,
      completion: completion
    });
    
  } catch (error) {
    console.error('Error in autoCompleteText:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate completion',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export { checkGrammar, enhanceText, summarizeText, autoCompleteText };