import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';

import { authRoutes, projectRoutes, logsRoutes, workflowRoutes, ingestRoutes } from './routes';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize DB
connectDB().catch(err => console.error(err));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', logsRoutes); 
app.use('/api/projects', workflowRoutes);
app.use('/api/ingest', ingestRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
