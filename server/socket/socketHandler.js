const Message = require('../models/Message');
const { sendNotification } = require('../controllers/notificationController');

const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user-online', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('online-users', Array.from(onlineUsers.keys()));
    });

    socket.on('send-message', async (data) => {
      try {
        const { sender, receiver, groupId, content, type, fileUrl, isSelfDestruct, replyTo } = data;

        const message = await Message.create({
          sender,
          receiver: receiver || null,
          groupId: groupId || null,
          content,
          type: type || 'text',
          fileUrl: fileUrl || '',
          isSelfDestruct: isSelfDestruct || false,
          replyTo: replyTo || null,
        });

        const populated = await message.populate([
          { path: 'sender', select: 'name avatar' },
          {
            path: 'replyTo',
            select: 'content sender type isDeleted',
            populate: { path: 'sender', select: 'name' },
          },
        ]);

        if (receiver) {
          const receiverSocketId = onlineUsers.get(receiver);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('receive-message', populated);
          }

          if (!onlineUsers.has(receiver)) {
            await sendNotification(receiver, {
              title: `New message from ${populated.sender.name}`,
              body: type === 'text' ? content : '📎 Sent an attachment',
              icon: '/icon.png',
            });
          }
        }

        if (groupId) {
          socket.to(groupId).emit('receive-message', populated);
        }

        socket.emit('message-sent', populated);
      } catch (err) {
        console.error('Socket message error:', err.message);
      }
    });

    socket.on('typing', ({ sender, receiver }) => {
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) io.to(receiverSocketId).emit('user-typing', sender);
    });

    socket.on('stop-typing', ({ sender, receiver }) => {
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) io.to(receiverSocketId).emit('user-stop-typing', sender);
    });

    socket.on('message-read', ({ messageId, sender }) => {
      const senderSocketId = onlineUsers.get(sender);
      if (senderSocketId) io.to(senderSocketId).emit('message-seen', messageId);
    });

    socket.on('join-group', (groupId) => {
      socket.join(groupId);
    });

    socket.on('call-user', ({ to, from, signal, callerName, isVoiceOnly, channel }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming-call', { from, signal, callerName, isVoiceOnly, channel });
      }
    });

    socket.on('answer-call', ({ to, signal, channel }) => {
      const callerSocketId = onlineUsers.get(to);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-accepted', signal);
      }
    });

    socket.on('end-call', ({ to }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('call-ended');
      }
    });

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