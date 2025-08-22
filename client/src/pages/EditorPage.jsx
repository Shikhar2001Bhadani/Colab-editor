import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Box, Spinner, Text, Flex, Avatar, Tooltip, HStack } from '@chakra-ui/react';
import Editor from '../components/Editor';
import AIAssistant from '../components/AIAssistant';
import useAuth from '../hooks/useAuth';
import { getDocumentById } from '../api/documentApi';

const EditorPage = () => {
  const { id: documentId } = useParams();
  const { userInfo } = useAuth();
  const [socket, setSocket] = useState(null);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const quillRef = useRef();

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

  useEffect(() => {
    if (!socket || !userInfo || !document) return;
    
    socket.emit('join-document', { documentId, user: userInfo });
    
    socket.on('user-list-updated', (users) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users);
      }
    });

    socket.on('cursor-update', ({ range, user }) => {
      if (quillRef.current && user) {
        const cursors = quillRef.current.getEditor().getModule('cursors');
        if (cursors && range) {
          cursors.removeCursor(user._id);
          cursors.createCursor(user._id, user.username, '#' + ((Math.random() * 0xFFFFFF) << 0).toString(16));
        }
      }
    });

    return () => {
      socket.emit('disconnect');
      socket.off('user-list-updated');
      socket.off('cursor-update');
    };
  }, [socket, userInfo, documentId, document]);

  if (loading) return <Spinner />;
  if (error) return <Text color="red.500">{error}</Text>;

  return (
    <Flex height="calc(100vh - 64px)">
      <Box flex="1" p={4} overflowY="auto">
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Text fontSize="2xl" fontWeight="bold">{document?.title}</Text>
          <HStack spacing={-2}>
            {onlineUsers?.length > 0 && onlineUsers.map(user => (
              user && user.username ? (
                <Tooltip key={user.id || user.socketId} label={user.username}>
                  <Avatar name={user.username} size="sm" />
                </Tooltip>
              ) : null
            ))}
          </HStack>
        </Flex>
        <Editor socket={socket} documentId={documentId} initialContent={document.content} quillRef={quillRef} />
      </Box>
      <AIAssistant quillRef={quillRef} documentId={documentId} />
    </Flex>
  );
};

export default EditorPage;