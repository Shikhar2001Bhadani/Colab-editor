import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Box, Spinner, Text, Flex, Avatar, Tooltip } from '@chakra-ui/react';
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
  const [activeUsers, setActiveUsers] = useState([]);
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

    socket.on('active-users', (users) => {
      setActiveUsers(users);
    });
    
    socket.on('user-joined', (user) => {
        setActiveUsers((prevUsers) => [...prevUsers.filter(u => u.id !== user.id), user]);
    });

    socket.on('user-left', (userId) => {
        setActiveUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
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
                {activeUsers.map(user => (
                    <Tooltip key={user.id} label={user.username} aria-label='A tooltip'>
                        <Avatar name={user.username} size="sm" ml="-2" />
                    </Tooltip>
                ))}
            </Flex>
        </Flex>
        <Editor socket={socket} documentId={documentId} initialContent={document.content} quillRef={quillRef} />
      </Box>
      <AIAssistant quillRef={quillRef} documentId={documentId} />
    </Flex>
  );
};

export default EditorPage;