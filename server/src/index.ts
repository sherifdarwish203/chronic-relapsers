import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import patientRoutes from './routes/patients';
import periodRoutes from './routes/periods';
import eventRoutes from './routes/events';
import eventsDirectRoutes from './routes/eventsDirect';
import facilitatorRoutes from './routes/facilitators';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGIN || 'https://yourdomain.com'
    : true,
  credentials: true,
}));
app.use(express.json());

// Rate limiter on patient login to prevent code brute-force
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'محاولات كثيرة — انتظر دقيقة وحاول تاني' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/api/v1/patients/login', loginLimiter);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/periods', periodRoutes);
app.use('/api/v1/periods', eventRoutes);       // POST /periods/:period_id/events
app.use('/api/v1/events', eventsDirectRoutes); // DELETE /events/:id
app.use('/api/v1/facilitators', facilitatorRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the React app in production (Express acts as the web server)
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
  // SPA fallback — all non-API routes return index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
