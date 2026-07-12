const Message = require('../models/Message');
const { sendNotification } = require('../controllers/notificationController');
const { registerDevice } = require('../controllers/twoFactorController');

const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    socket.on('user-online', async (data) => {
      const userId = typeof data === 'string' ? data : data.userId;
      const deviceInfo = typeof data === 'object' ? data.deviceInfo : null;

      onlineUsers.set(userId, socket.id);
      io.emit('online-users', Array.from(onlineUsers.keys()));

      if (deviceInfo) {
        await registerDevice(userId, deviceInfo);
      }
    });

    socket.on('send-message', async (data) => {
      try {
        const {
          sender, receiver, groupId, content, type, fileUrl,
          isSelfDestruct, selfDestructSeconds, replyTo,
          isForwarded, label
        } = data;

        const message = await Message.create({
          sender,
          receiver: receiver || null,
          groupId: groupId || null,
          content,
          type: type || 'text',
          fileUrl: fileUrl || '',
          isSelfDestruct: isSelfDestruct || false,
          selfDestructAt: isSelfDestruct && selfDestructSeconds
            ? new Date(Date.now() + selfDestructSeconds * 1000)
            : null,
          replyTo: replyTo || null,
          isForwarded: isForwarded || false,
          label: label || null,
          isSent: true,
          isScheduled: false,
        });

        const populated = await message.populate([
          { path: 'sender', select: 'name avatar' },
          { path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'name' } }
        ]);

        if (groupId) {
          // Sender already joined this room, so everyone (including sender) gets it once
          io.to(groupId.toString()).emit('receive-message', populated);
        } else if (receiver) {
          const receiverSocketId = onlineUsers.get(receiver);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('receive-message', populated);
          } else {
            await sendNotification(receiver, {
              title: `${populated.sender.name}`,
              body: type === 'text' ? content.substring(0, 80) : '📎 Sent an attachment',
              icon: '/icon-192.png',
            });
          }
          // CRITICAL FIX: always echo back to sender's own socket too,
          // otherwise the sender never sees their own sent message.
          socket.emit('receive-message', populated);
        } else {
          socket.emit('receive-message', populated);
        }
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

    socket.on('join-group', (groupId) => socket.join(groupId));

    socket.on('call-user', ({ to, from, signal, callerName, isVoiceOnly, channel }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) io.to(receiverSocketId).emit('incoming-call', { from, signal, callerName, isVoiceOnly, channel });
    });

    socket.on('answer-call', ({ to, signal }) => {
      const callerSocketId = onlineUsers.get(to);
      if (callerSocketId) io.to(callerSocketId).emit('call-accepted', signal);
    });

    socket.on('end-call', ({ to }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) io.to(receiverSocketId).emit('call-ended');
    });

    socket.on('disconnect', () => {
      onlineUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) onlineUsers.delete(userId);
      });
      io.emit('online-users', Array.from(onlineUsers.keys()));
    });
  });

  // Scheduled messages cron — har minute check karo
  setInterval(async () => {
    try {
      const now = new Date();
      const scheduledMessages = await Message.find({
        isScheduled: true,
        isSent: false,
        scheduledAt: { $lte: now }
      }).populate('sender', 'name avatar');

      for (const msg of scheduledMessages) {
        msg.isSent = true;
        msg.isScheduled = false;
        await msg.save();

        const populated = await msg.populate([
          { path: 'sender', select: 'name avatar' },
          { path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'name' } }
        ]);

        if (msg.receiver) {
          const receiverSocketId = onlineUsers.get(msg.receiver.toString());
          if (receiverSocketId) io.to(receiverSocketId).emit('receive-message', populated);
        }
        if (msg.groupId) {
          io.to(msg.groupId.toString()).emit('receive-message', populated);
        }
      }
    } catch (err) {
      console.error('Scheduled message error:', err.message);
    }
  }, 60000);
};

module.exports = socketHandler;