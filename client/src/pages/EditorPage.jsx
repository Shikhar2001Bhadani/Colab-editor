import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Box, Spinner, Text, Flex, Avatar, Tooltip, HStack, useToast } from '@chakra-ui/react';
import Editor from '../components/Editor';
import AIAssistant from '../components/AIAssistant';
import ErrorBoundary from '../components/ErrorBoundary';
import useAuth from '../hooks/useAuth';
import { getDocumentById } from '../api/documentApi';

const EditorPage = () => {
  const { id: documentId } = useParams();
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [socket, setSocket] = useState(null);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const quillRef = useRef();
  const socketRef = useRef();
  const mountedRef = useRef(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const docData = await getDocumentById(documentId);
        setDocument(docData);
      } catch (err) {
        setError('Failed to load document or you do not have permission.');
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();

    const s = io(import.meta.env.VITE_CLIENT_URL || 'http://localhost:5000');
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [documentId]);

  // Setup socket connection
  useEffect(() => {
    try {
      const s = io(import.meta.env.VITE_CLIENT_URL || 'http://localhost:5000', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      socketRef.current = s;
      setSocket(s);

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (err) {
      console.error('Socket connection error:', err);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to server',
        status: 'error',
        duration: 5000,
      });
    }
  }, [toast]);

  // Handle socket events
  useEffect(() => {
    if (!socketRef.current || !userInfo || !document) return;

    const handleUserListUpdate = (users) => {
      if (!mountedRef.current) return;
      if (Array.isArray(users)) {
        setOnlineUsers(prev => {
          // Only update if the list has actually changed
          const prevIds = new Set(prev.map(u => u.id));
          const newIds = new Set(users.map(u => u.id));
          if (prevIds.size !== newIds.size || 
              !Array.from(prevIds).every(id => newIds.has(id))) {
            return users;
          }
          return prev;
        });
      }
    };

    const handleCursorUpdate = ({ range, user }) => {
      if (!mountedRef.current || !quillRef.current || !user) return;
      try {
        const cursors = quillRef.current.getEditor().getModule('cursors');
        if (cursors && range) {
          const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;
          requestAnimationFrame(() => {
            cursors.createCursor(user._id, user.username, color);
            cursors.moveCursor(user._id, range);
          });
        }
      } catch (err) {
        console.warn('Cursor update error:', err);
      }
    };

    socketRef.current.emit('join-document', { documentId, user: userInfo });
    
    socketRef.current.on('user-list-updated', handleUserListUpdate);
    socketRef.current.on('cursor-update', handleCursorUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-document', { documentId, user: userInfo });
        socketRef.current.off('user-list-updated', handleUserListUpdate);
        socketRef.current.off('cursor-update', handleCursorUpdate);
      }
    };
  }, [documentId, userInfo, document]);

  if (loading) return <Spinner />;
  if (error) return <Text color="red.500">{error}</Text>;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (loading) return <Spinner size="xl" />;
  if (error) {
    return (
      <Box textAlign="center" p={8}>
        <Text color="red.500" mb={4}>{error}</Text>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </Box>
    );
  }

  const safeOnlineUsers = useMemo(() => {
    return onlineUsers.filter(user => user && typeof user === 'object' && user.username);
  }, [onlineUsers]);

  return (
    <ErrorBoundary>
      <Flex height="calc(100vh - 64px)">
        <Box flex="1" p={4} overflowY="auto">
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Text fontSize="2xl" fontWeight="bold">{document?.title || 'Untitled'}</Text>
            <HStack spacing={-2}>
              {safeOnlineUsers.map(user => (
                <Tooltip key={user.id || user.socketId} label={user.username}>
                  <Avatar 
                    name={user.username} 
                    size="sm"
                    bg={`hsl(${Math.random() * 360}, 70%, 50%)`} 
                  />
                </Tooltip>
              ))}
            </HStack>
          </Flex>
          <Editor 
            socket={socketRef.current} 
            documentId={documentId} 
            initialContent={document?.content} 
            quillRef={quillRef} 
          />
        </Box>
        <AIAssistant quillRef={quillRef} documentId={documentId} />
      </Flex>
    </ErrorBoundary>
  );
};

export default EditorPage;