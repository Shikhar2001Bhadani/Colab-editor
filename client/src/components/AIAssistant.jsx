import {
  Box, Button, VStack, Text, Select, useToast, Textarea, Spinner, Heading, HStack
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { checkGrammar, enhanceText, summarizeText, autoCompleteText as apiAutoComplete } from '../api/aiApi';

const AIAssistant = ({ quillRef, documentId }) => {
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [lastSelection, setLastSelection] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const s = io(import.meta.env.VITE_CLIENT_URL || 'http://localhost:5000');
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const [isAutoCompleting, setIsAutoCompleting] = useState(false);

  const handleAutoComplete = async () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    
    const range = quill.getSelection();
    if (!range) {
      toast({ 
        title: 'Place cursor', 
        description: 'Please place your cursor where you want to auto-complete', 
        status: 'info',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    // Get the current text and cursor position
    const currentText = quill.getText();
    const cursorPos = range.index;
    
    // Get the current line and word being typed
    const textBeforeCursor = currentText.substring(0, cursorPos);
    const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
    const currentLine = textBeforeCursor.substring(currentLineStart);
    
    // Get the current word and its start position
    const wordsBeforeCursor = currentLine.split(/\s+/);
    const currentWord = wordsBeforeCursor[wordsBeforeCursor.length - 1] || '';
    const currentWordStart = cursorPos - currentWord.length;
    
    // Get broader context from previous text
    const contextWindow = 500;
    const contextStart = Math.max(0, currentWordStart - contextWindow);
    
    // Get the text before the current word for context
    const previousText = currentText.substring(contextStart, currentWordStart);
    const textBeforeWord = textBeforeCursor.substring(0, currentWordStart).trim();
    
    // Build the context from the most relevant sentences
    const contextSentences = previousText.match(/[^.!?]+[.!?]+/g) || [];
    const contextText = contextSentences.length > 0
      ? contextSentences.slice(-3).join(' ').trim()
      : previousText.trim();
      
    // Final context preparation
    const context = contextText;
    
    if (currentWord.length < 2) {
      toast({ 
        title: 'Type more', 
        description: 'Please type at least 2 characters to auto-complete', 
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    setIsAutoCompleting(true);
    try {
      // Debounce the request
      await new Promise(resolve => setTimeout(resolve, 300));

      const response = await fetch('/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          text: currentWord,
          prefix: textBeforeWord,
          context: context,
          fullParagraph: currentLine,
          cursorPosition: cursorPos
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get completion');
      }
      
      if (data.success && data.completion) {
        // Calculate how much to delete (just the current word)
        const deleteLength = currentWord.length;
        
        // Remove the partial sentence
        quill.deleteText(cursorPos - deleteLength, deleteLength, 'user');
        
        // Insert the completion
        const completion = data.completion.trim();
        
        // Ensure proper spacing and punctuation
        let completionText = completion;
        if (!completion.match(/^[.,!?;:)]/) && !completion.startsWith(' ')) {
          completionText = ' ' + completionText;
        }
        if (!completion.match(/[.!?]$/)) {
          completionText += '.';
        }
        
        quill.insertText(cursorPos - deleteLength, completionText, 'user');
        
        // Move cursor to the end of the inserted text
        const newPos = cursorPos - deleteLength + completionText.length;
        quill.setSelection(newPos, 0, 'user');
      }
    } catch (error) {
      console.error('Auto-complete error:', error);
      
      // More user-friendly error messages
      let errorMessage = 'Please try again';
      if (error.message.includes('Rate limit') || error.message.includes('busy')) {
        errorMessage = 'Too many requests. Please wait a few seconds and try again.';
      } else if (error.message.includes('timed out')) {
        errorMessage = 'Request took too long. Please try again.';
      }
      
      toast({ 
        title: 'Auto-complete paused', 
        description: errorMessage,
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsAutoCompleting(false);
    }
  };

  const handleAction = async (action) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    
    const range = quill.getSelection();
    if (!range) {
      toast({ title: 'Please select some text first', status: 'warning' });
      return;
    }
    
    // Store the current selection
    setLastSelection({ index: range.index, length: range.length });
    
    const text = quill.getText(range.index, range.length);
    if (!text.trim()) {
      toast({ title: 'No text selected', status: 'warning' });
      return;
    }
    
    setLoading(true);
    setResult('');
    
    try {
      let response;
      if (action === 'grammar') {
        response = await checkGrammar(text);
        setResult(response.suggestion);
      } else if (action === 'enhance') {
        response = await enhanceText(text, tone);
        setResult(response.suggestion);
      } else if (action === 'summarize') {
        response = await summarizeText(text);
        setResult(response.summary);
      }
    } catch (error) {
      toast({ title: 'AI Assistant Error', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const applySuggestion = () => {
    try {
      // Get editor instance
      const quill = quillRef.current?.getEditor();
      
      // Validate editor instance
      if (!quill) {
        throw new Error('Editor not initialized');
      }
      
      // Validate selection and result
      if (!lastSelection) {
        throw new Error('No text selection found');
      }
      
      if (!result) {
        throw new Error('No suggestion available to apply');
      }
      
      // Validate result type and content
      if (typeof result !== 'string' || result.trim().length === 0) {
        throw new Error('Invalid suggestion content');
      }
      
      // Get and validate selection bounds
      const { index, length } = lastSelection;
      if (typeof index !== 'number' || typeof length !== 'number') {
        throw new Error('Invalid selection range');
      }
      
      // Validate selection bounds against document length
      const docLength = quill.getLength();
      if (index < 0 || index >= docLength || index + length > docLength) {
        throw new Error('Selection out of document bounds');
      }
      
      // Get current editor contents
      const currentContents = quill.getContents();
      
      try {
        // Safely create the delta operations
        const ops = [];
        
        // Only add retain if we need to preserve text before our edit
        if (index > 0) {
          ops.push({ retain: index });
        }
        
        // Add delete operation if we have text to delete
        if (length > 0) {
          ops.push({ delete: length });
        }
        
        // Add insert operation if we have text to insert
        if (result && result.length > 0) {
          ops.push({ insert: result });
        }
        
        // Create the delta with our operations
        const delta = { ops };
        
        // Apply the delta in a single operation
        quill.updateContents(delta, 'user');
        
        // Calculate new cursor position (safely)
        const newIndex = index + (result ? result.length : 0);
        
        // Update the cursor position after a brief delay to ensure content is updated
        setTimeout(() => {
          quill.setSelection(newIndex, 0, 'user');
          
          // Emit changes to other clients
          if (socket && documentId) {
            socket.emit('text-change', delta, documentId);
            socket.emit('cursor-move', { index: newIndex, length: 0 }, documentId, {
              _id: socket.id,
              username: 'User'
            });
          }
        }, 10);
      } catch (error) {
        console.error('Delta application error:', error);
        throw new Error('Failed to apply changes to the document');
      }
      
      // Only clear if successfully applied
      setResult('');
      setLastSelection(null);
      
      // Show success message
      toast({
        title: 'Suggestion applied',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
      
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast({ 
        title: 'Failed to apply suggestion', 
        description: error.message || 'Please try again', 
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    }
  };

  return (
    <Box w="300px" bg="gray.100" p={4} borderLeft="1px solid" borderColor="gray.200">
      <VStack spacing={4} align="stretch">
        <Heading size="md">AI Assistant</Heading>
        <Text fontSize="sm">Select text in the editor and choose an action.</Text>
        <VStack spacing={4} align="stretch">
          <Button 
            colorScheme="blue" 
            onClick={() => handleAction('grammar')}
            isLoading={loading}
          >
            Check Grammar
          </Button>
          <Button 
            colorScheme="green" 
            onClick={() => handleAction('enhance')}
            isLoading={loading}
          >
            Enhance Text
          </Button>
          <Button 
            colorScheme="teal"
            onClick={handleAutoComplete}
            isLoading={isAutoCompleting}
            leftIcon={<span>🤖</span>}
          >
            Auto-Complete
          </Button>
          <Button 
            colorScheme="purple" 
            onClick={() => handleAction('summarize')}
            isLoading={loading}
          >
            Summarize
          </Button>
        </VStack>
        <HStack>
          <Select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="persuasive">Persuasive</option>
          </Select>
          <Button onClick={() => handleAction('enhance')} isLoading={loading} flexShrink={0}>Enhance</Button>
        </HStack>
        {loading && <Spinner />}
        {result && (
          <Box>
            <Textarea value={result} isReadOnly rows={8} />
            <Button mt={2} size="sm" colorScheme="green" onClick={applySuggestion}>Apply Suggestion</Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default AIAssistant;