import { useState, useEffect, useCallback } from 'react';

const useActiveUsers = (socket, documentId, userInfo) => {
  const [users, setUsers] = useState([]);

  const safeParseJSON = (data) => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed to parse JSON:', e);
        return [];
      }
    }
    return [];
  };

  const handleActiveUsers = useCallback((receivedUsers) => {
    if (!receivedUsers) return;
    const parsedUsers = safeParseJSON(receivedUsers);
    setUsers(prevUsers => {
      // Merge with existing users, removing duplicates
      const uniqueUsers = [...prevUsers];
      parsedUsers.forEach(newUser => {
        if (!uniqueUsers.some(u => u.id === newUser.id)) {
          uniqueUsers.push(newUser);
        }
      });
      return uniqueUsers;
    });
  }, []);

  const handleUserJoined = useCallback((userData) => {
    if (!userData) return;
    try {
      const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
      if (!user.id || !user.username) return;
      
      setUsers(prevUsers => {
        const currentUsers = Array.isArray(prevUsers) ? prevUsers : [];
        if (currentUsers.some(u => u.id === user.id)) {
          return currentUsers;
        }
        return [...currentUsers, user];
      });
    } catch (e) {
      console.warn('Failed to handle user joined:', e);
    }
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

    // Clear users when socket changes
    setUsers([]);

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
