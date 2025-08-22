import { useState, useEffect, useCallback } from 'react';

const useActiveUsers = (socket, documentId, userInfo) => {
  const [users, setUsers] = useState([]);

  const handleActiveUsers = useCallback((receivedUsers) => {
    if (!receivedUsers) return;
    try {
      const parsedUsers = Array.isArray(receivedUsers) ? receivedUsers : JSON.parse(receivedUsers);
      setUsers(Array.isArray(parsedUsers) ? parsedUsers : []);
    } catch (error) {
      console.warn('Failed to parse active users:', error);
      setUsers([]);
    }
  }, []);

  const handleUserJoined = useCallback((user) => {
    if (!user) return;
    setUsers(prevUsers => {
      const currentUsers = Array.isArray(prevUsers) ? prevUsers : [];
      const exists = currentUsers.some(u => u.id === user.id);
      if (exists) {
        return currentUsers;
      }
      return [...currentUsers, user];
    });
  }, []);

  const handleUserLeft = useCallback((userId) => {
    if (!userId) return;
    setUsers(prevUsers => {
      const currentUsers = Array.isArray(prevUsers) ? prevUsers : [];
      return currentUsers.filter(user => user.id !== userId);
    });
  }, []);

  useEffect(() => {
    if (!socket || !documentId || !userInfo) return;

    socket.on('active-users', handleActiveUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('active-users', handleActiveUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, documentId, userInfo, handleActiveUsers, handleUserJoined, handleUserLeft]);

  return users;
};

export default useActiveUsers;
