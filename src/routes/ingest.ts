import { Router, Request, Response } from 'express';
import { Project } from '../models/Project';
import { Log } from '../models/Log';
import { dispatchWorkflow } from '../services/workflowEngine';

export const ingestRoutes = Router();

ingestRoutes.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const apiKey = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split('Bearer ')[1] 
      : req.headers['x-api-key'] as string;
    
    if (!apiKey) {
       res.status(401).json({ error: 'Missing API Key in Authorization or x-api-key header' });
       return;
    }

    const project = await Project.findOne({ apiKey });
    if (!project) {
       res.status(401).json({ error: 'Invalid API Key' });
       return;
    }

    const { level, message, stackTrace, metadata, environment, timestamp } = req.body;

    if (!level || !message) {
       res.status(400).json({ error: 'Missing required fields: level and message' });
       return;
    }

    const validLevels = ['info', 'warning', 'error', 'critical', 'debug'];
    const sanitizedLevel = level.toLowerCase();
    
    if (!validLevels.includes(sanitizedLevel)) {
        res.status(400).json({ error: `Invalid level. Must be one of: ${validLevels.join(', ')}` });
        return;
    }

    const logEnv = environment || 'production';
    const logTimestamp = timestamp ? new Date(timestamp) : new Date();

    const log = await Log.create({
      projectId: project._id,
      level: sanitizedLevel,
      message,
      stackTrace,
      metadata: metadata || {},
      environment: logEnv,
      timestamp: logTimestamp
    });

    // Fire off async workflow engine
    dispatchWorkflow(log).catch(err => console.error('Workflow dispatch error:', err));

    res.status(202).json({ message: 'Log ingested successfully', id: log._id });
  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({ error: 'Internal server error during ingestion' });
  }
});
