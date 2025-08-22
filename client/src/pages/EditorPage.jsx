import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Box, Spinner, Text, Flex, Avatar, Tooltip, VStack } from '@chakra-ui/react';
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
  const [activeUsers, setActiveUsers] = useState(new Set());
  const [userDetails, setUserDetails] = useState({});
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
    
    const handleActiveUsers = (users) => {
      try {
        const parsedUsers = typeof users === 'string' ? JSON.parse(users) : users;
        if (!Array.isArray(parsedUsers)) return;
        
        const newUserDetails = {};
        const newActiveUsers = new Set();
        
        parsedUsers.forEach(user => {
          if (user && user.id && user.username) {
            newUserDetails[user.id] = user;
            newActiveUsers.add(user.id);
          }
        });
        
        setUserDetails(newUserDetails);
        setActiveUsers(newActiveUsers);
      } catch (error) {
        console.warn('Failed to parse active users:', error);
      }
    };

    const handleUserJoined = (userData) => {
      try {
        const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
        if (!user || !user.id || !user.username) return;

        setUserDetails(prev => ({...prev, [user.id]: user}));
        setActiveUsers(prev => new Set([...prev, user.id]));
      } catch (error) {
        console.warn('Failed to handle user joined:', error);
      }
    };

    const handleUserLeft = (userId) => {
      if (!userId) return;
      setActiveUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      
      if (quillRef.current) {
        const cursors = quillRef.current.getEditor().getModule('cursors');
        cursors.removeCursor(userId);
      }
    };

    socket.emit('join-document', { documentId, user: userInfo });
    
    socket.on('active-users', handleActiveUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.emit('leave-document', { documentId, user: userInfo });
      socket.off('active-users', handleActiveUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, userInfo, documentId, document]);

  if (loading) return <Spinner />;
  if (error) return <Text color="red.500">{error}</Text>;

  const renderActiveUsers = () => {
    const elements = [];
    activeUsers.forEach(userId => {
      const user = userDetails[userId];
      if (user && user.username) {
        elements.push(
          <Tooltip key={userId} label={user.username} aria-label='A tooltip'>
            <Avatar name={user.username} size="sm" ml="-2" />
          </Tooltip>
        );
      }
    });
    return elements;
  };

  return (
    <Flex height="calc(100vh - 64px)">
      <Box flex="1" p={4} overflowY="auto">
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Text fontSize="2xl" fontWeight="bold">{document?.title}</Text>
          <Flex>
            {renderActiveUsers()}
          </Flex>
        </Flex>
        <Editor socket={socket} documentId={documentId} initialContent={document.content} quillRef={quillRef} />
      </Box>
      <AIAssistant quillRef={quillRef} documentId={documentId} />
    </Flex>
  );
};

export default EditorPage;