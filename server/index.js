const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');

const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const extraRoutes = require('./routes/extraRoutes');

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://chat-ai-18y1.vercel.app'],
    credentials: true
  },
  maxHttpBufferSize: 1e8,
});

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://chat-ai-18y1.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/extra', extraRoutes);

app.get('/', (req, res) => res.json({ message: 'NexChat server running! 🚀' }));

socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));