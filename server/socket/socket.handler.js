const jwt = require('jsonwebtoken');
const { bboxGeohash } = require('../utils/geohash');

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    console.log(`Socket connected: user:${socket.userId}`);

    socket.on('map:subscribe', ({ boundingBox }) => {
      if (!boundingBox) return;
      const hash = bboxGeohash(boundingBox);
      const room = `bbox:${hash}`;
      socket.join(room);
      socket.currentBboxRoom = room;
    });

    socket.on('map:unsubscribe', ({ boundingBox }) => {
      if (!boundingBox) return;
      const hash = bboxGeohash(boundingBox);
      socket.leave(`bbox:${hash}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user:${socket.userId}`);
    });
  });
};
