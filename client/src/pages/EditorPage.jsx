import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Box, Spinner, Text, Flex, Avatar, Tooltip } from '@chakra-ui/react';
import Editor from '../components/Editor';
import AIAssistant from '../components/AIAssistant';
import useAuth from '../hooks/useAuth';
import useActiveUsers from '../hooks/useActiveUsers';
import { getDocumentById } from '../api/documentApi';

const EditorPage = () => {
  const { id: documentId } = useParams();
  const { userInfo } = useAuth();
  const [socket, setSocket] = useState(null);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const activeUsers = useActiveUsers(socket, documentId, userInfo);

  useEffect(() => {
    if (!socket || !userInfo || !document) return;
    
    socket.emit('join-document', { documentId, user: userInfo });

    socket.on('user-left', (userId) => {
      if (quillRef.current) {
        const cursors = quillRef.current.getEditor().getModule('cursors');
        cursors.removeCursor(userId);
      }
    });

    return () => {
      socket.emit('leave-document', { documentId, user: userInfo });
      socket.off('active-users');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [socket, userInfo, documentId, document]);

  if (loading) return <Spinner />;
  if (error) return <Text color="red.500">{error}</Text>;

  return (
    <Flex height="calc(100vh - 64px)">
      <Box flex="1" p={4} overflowY="auto">
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Text fontSize="2xl" fontWeight="bold">{document?.title}</Text>
            <Flex>
                {activeUsers?.filter(Boolean).map(user => user?.id && user?.username ? (
                    <Tooltip key={user.id} label={user.username} aria-label='A tooltip'>
                        <Avatar name={user.username} size="sm" ml="-2" />
                    </Tooltip>
                ) : null)}
            </Flex>
        </Flex>
        <Editor socket={socket} documentId={documentId} initialContent={document.content} quillRef={quillRef} />
      </Box>
      <AIAssistant quillRef={quillRef} documentId={documentId} />
    </Flex>
  );
};

export default EditorPage;