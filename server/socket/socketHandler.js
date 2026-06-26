const Message = require('../models/Message');

const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User join karta hai
    socket.on('user-online', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('online-users', Array.from(onlineUsers.keys()));
    });

    // Message send karna
    socket.on('send-message', async (data) => {
      const { sender, receiver, groupId, content, type, fileUrl, isSelfDestruct } = data;

      const message = await Message.create({
        sender,
        receiver: receiver || null,
        groupId: groupId || null,
        content,
        type: type || 'text',
        fileUrl: fileUrl || '',
        isSelfDestruct: isSelfDestruct || false
      });

      const populated = await message.populate('sender', 'name avatar');

      // Receiver ko message bhejo
      if (receiver) {
        const receiverSocketId = onlineUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive-message', populated);
        }
      }

      // Group message
      if (groupId) {
        socket.to(groupId).emit('receive-message', populated);
      }

      // Typing stop
      socket.emit('message-sent', populated);
    });

    // Typing indicator
    socket.on('typing', ({ sender, receiver }) => {
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-typing', sender);
      }
    });

    socket.on('stop-typing', ({ sender, receiver }) => {
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-stop-typing', sender);
      }
    });

    // Read receipt
    socket.on('message-read', ({ messageId, sender }) => {
      const senderSocketId = onlineUsers.get(sender);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message-seen', messageId);
      }
    });

    // Group join
    socket.on('join-group', (groupId) => {
      socket.join(groupId);
    });

    // Disconnect
    socket.on('disconnect', () => {
      onlineUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
        }
      });
      io.emit('online-users', Array.from(onlineUsers.keys()));
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler;