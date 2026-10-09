require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const { Server } = require('socket.io');

const redis = require('./config/redis');
const runClusterRefresh = require('./jobs/clusterRefresh.job');
const runExpireReports = require('./jobs/expireReports.job');

const authRoutes = require('./routes/auth.routes');
const reportRoutes = require('./routes/report.routes');
const routeRoutes = require('./routes/route.routes');
const clusterRoutes = require('./routes/cluster.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);
require('./socket/socket.handler')(io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'NightSafe API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/clusters', clusterRoutes);
app.use('/api/users', userRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.get('/api/dev/trigger-cluster', async (req, res) => {
    try {
      const clusters = await runClusterRefresh(io);
      res.json({ success: true, data: clusters, message: 'Cluster job triggered' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/dev/trigger-expire', async (req, res) => {
    try {
      const count = await runExpireReports(io);
      res.json({ success: true, data: { expired: count }, message: 'Expire job triggered' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

cron.schedule('*/30 * * * *', () => runClusterRefresh(io));
cron.schedule('0 0 * * *', () => runExpireReports(io));

const { buildOSMGraph } = require('./algorithm/graphBuilder');

const PORT = process.env.PORT || 5000;

redis.connect().catch(() => {
  console.warn('Redis not available — caching disabled');
});

httpServer.listen(PORT, () => {
  console.log(`NightSafe server running on port ${PORT}`);
  buildOSMGraph()
    .then(() => console.log('OSM road network ready'))
    .catch((err) =>
      console.warn('OSM preload failed, will retry on first route request:', err.message)
    );
});

module.exports = app;
