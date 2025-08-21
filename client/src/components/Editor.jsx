import React, { useEffect, useCallback, useState } from 'react';
import axios from 'axios';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import * as QuillCursors from 'quill-cursors';
import useAuth from '../hooks/useAuth';
import '../index.css';

Quill.register('modules/cursors', QuillCursors.default);

const SAVE_INTERVAL_MS = 3000;

const Editor = ({ socket, documentId, initialContent, quillRef }) => {
  const { userInfo } = useAuth();

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
    cursors: {
      transformOnTextChange: true,
    },
    history: {
        userOnly: true
    }
  };

  const setupQuill = useCallback((quill) => {
    if (!quill) return;
    quillRef.current = quill;
    const editor = quill.getEditor();
    editor.disable();
    editor.setText('Loading document...');
    editor.setContents(initialContent);
    editor.enable();
  }, [initialContent, quillRef]);

  // Handle receiving changes
  useEffect(() => {
    if (!socket || !quillRef.current) return;
    const handler = (delta) => {
      quillRef.current.getEditor().updateContents(delta);
    };
    socket.on('receive-changes', handler);
    return () => socket.off('receive-changes', handler);
  }, [socket, quillRef]);

  // Handle text change emission
  const handleChange = (content, delta, source, editor) => {
    if (source !== 'user' || !socket) return;
    socket.emit('text-change', delta, documentId);
  };
  
  // Handle cursor and selection updates
  useEffect(() => {
    if (!socket || !quillRef.current) return;
    
    const editor = quillRef.current.getEditor();
    const cursors = editor.getModule('cursors');
    const colors = ['#FF5252', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#00BCD4'];
    const userColor = colors[userInfo._id.charCodeAt(0) % colors.length];
    
    // Initialize cursors module
    const existingCursors = cursors.cursors();
    Object.keys(existingCursors).forEach(id => {
      if (id !== userInfo._id) {
        cursors.removeCursor(id);
      }
    });
    
    // Create cursor for current user
    const cursor = cursors.createCursor(userInfo._id, userInfo.username, userColor);
    cursor.hide(); // Hide initially until we have a position

    // Track last cursor position to avoid unnecessary updates
    let lastRange = null;
    let debounceTimer = null;

    // Handle local selection changes and emit them
    const handleSelectionChange = (range, oldRange, source) => {
      if (source === 'user' && range) {
        // Only emit if position actually changed
        if (!lastRange || range.index !== lastRange.index || range.length !== lastRange.length) {
          lastRange = range;
          
          // Debounce cursor updates to reduce network traffic
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            socket.emit('cursor-move', range, documentId, userInfo);
          }, 50);
        }
        
        // Show cursor when user is active
        cursor.show();
      }
    };
    
    // Listen for remote cursor updates
    const handleCursorUpdate = ({ range, user }) => {
      if (user._id !== userInfo._id) {
        const cursorColor = colors[user._id.charCodeAt(0) % colors.length];
        let remoteCursor = cursors.cursors()[user._id];
        
        if (!remoteCursor) {
          remoteCursor = cursors.createCursor(user._id, user.username, cursorColor);
          remoteCursor.hide();
        }
        
        if (range) {
          // Only update if position changed
          const currentRange = remoteCursor.range;
          if (!currentRange || range.index !== currentRange.index || range.length !== currentRange.length) {
            // Update the cursor position safely
            try {
              if (typeof remoteCursor.moveCursor === 'function') {
                remoteCursor.moveCursor(range.index, range.length > 0);
              } else {
                // Fallback method if moveCursor isn't available
                remoteCursor.update({
                  range: {
                    index: range.index,
                    length: range.length
                  }
                });
              }
              
              if (range.length > 0 && typeof remoteCursor.setSelection === 'function') {
                remoteCursor.setSelection(range.index, range.length);
              }
              
              remoteCursor.show();
            } catch (error) {
              console.warn('Error updating cursor:', error);
              // Try to recreate the cursor if it failed
              cursors.removeCursor(user._id);
              remoteCursor = cursors.createCursor(user._id, user.username, cursorColor);
              remoteCursor.show();
            }
            
            // Hide cursor after inactivity
            clearTimeout(remoteCursor.timeout);
            remoteCursor.timeout = setTimeout(() => {
              remoteCursor.hide();
            }, 2000);
          }
        }
      }
    };

    // Set up event listeners
    editor.on('selection-change', handleSelectionChange);
    socket.on('cursor-update', handleCursorUpdate);

    // Clean up
    return () => {
      clearTimeout(debounceTimer);
      editor.off('selection-change', handleSelectionChange);
      socket.off('cursor-update', handleCursorUpdate);
      
      // Clean up all remote cursors
      const allCursors = cursors.cursors();
      Object.keys(allCursors).forEach(id => {
        if (allCursors[id].timeout) {
          clearTimeout(allCursors[id].timeout);
        }
        if (id !== userInfo._id) {
          cursors.removeCursor(id);
        }
      });
    };
  }, [socket, quillRef, documentId, userInfo]);


  // Auto-save functionality
  useEffect(() => {
    if (!socket || !quillRef.current) return;
    const interval = setInterval(() => {
      const content = quillRef.current.getEditor().getContents();
      socket.emit('save-document', content, documentId);
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [socket, quillRef, documentId]);

  return (
    <div className="container">
      <ReactQuill ref={setupQuill} theme="snow" modules={modules} onChange={handleChange} />
    </div>
  );
};

export default Editor;