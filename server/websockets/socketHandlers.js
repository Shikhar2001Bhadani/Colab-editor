import Document from '../models/Document.js';

const activeUsers = {}; // In-memory store for active users in each doc

const socketHandlers = (socket, io) => {
  const getUserIdFromSocket = () => {
    // This is a simplified way to get user info. In a real app, you'd use the authenticated user from the socket handshake.
    return socket.handshake.query.userId || socket.id;
  }

  // Join a document room
  socket.on('join-document', async ({ documentId, user }) => {
    if (!documentId || !user || !user._id || !user.username) {
      console.warn('Invalid join-document data:', { documentId, user });
      return;
    }

    socket.join(documentId);
    console.log(`User ${user.username} (${socket.id}) joined document ${documentId}`);

    if (!activeUsers[documentId]) {
      activeUsers[documentId] = [];
    }

    const safeUser = {
      id: user._id.toString(),
      username: user.username,
      socketId: socket.id
    };

    // Remove any existing instances of this user
    activeUsers[documentId] = activeUsers[documentId].filter(u => u.id !== safeUser.id);
    
    // Add the user to active users
    activeUsers[documentId].push(safeUser);

    // Ensure we're sending an array
    const usersToSend = Array.isArray(activeUsers[documentId]) 
      ? activeUsers[documentId]
      : [];

    // Send current list of active users to the new user
    socket.emit('active-users', JSON.stringify(usersToSend));
    
    // Notify others about the new user
    socket.to(documentId).emit('user-joined', JSON.stringify(safeUser));

    const document = await Document.findById(documentId);
    if (document) {
      socket.emit('load-document', document);
    }
  });

  // Handle text changes
  socket.on('text-change', (delta, documentId) => {
    socket.to(documentId).emit('receive-changes', delta);
  });

  // Handle cursor movement and selection
  socket.on('cursor-move', (range, documentId, user) => {
    // Get the current selection from the client
    const selection = {
      index: range?.index || 0,
      length: range?.length || 0
    };
    
    // Broadcast the cursor position and selection to all other clients in the room
    socket.to(documentId).emit('cursor-update', { 
      range, 
      user,
      selection: selection.length > 0 ? selection : null
    });
  });

  // Handle document saving
  socket.on('save-document', async (content, documentId) => {
    try {
      await Document.findByIdAndUpdate(documentId, { content });
      // Optionally, emit a confirmation back to the saving client
      socket.emit('document-saved', 'Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      socket.emit('save-error', 'Error saving document.');
    }
  });

  // Leave a document room
  socket.on('leave-document', ({ documentId, user }) => {
    socket.leave(documentId);
    console.log(`User ${user.username} left document ${documentId}`);
    if (activeUsers[documentId]) {
      activeUsers[documentId] = activeUsers[documentId].filter(u => u.id !== user._id);
      io.to(documentId).emit('user-left', user._id);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Handle user leaving all rooms they were in
    for (const documentId in activeUsers) {
        const userInDoc = activeUsers[documentId].find(u => u.socketId === socket.id); // You'd need a better mapping
        if(userInDoc){
            activeUsers[documentId] = activeUsers[documentId].filter(u => u.socketId !== socket.id);
            io.to(documentId).emit('user-left', userInDoc.id);
        }
    }
  });
};

export default socketHandlers;