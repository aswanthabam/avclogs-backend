import { Router, Response } from 'express';
import crypto from 'crypto';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { Project } from '../models/Project';
import { Log } from '../models/Log';
import { Workflow } from '../models/Workflow';

export const projectRoutes = Router();

projectRoutes.use(requireAuth);

const generateApiKey = () => `lf_${crypto.randomBytes(24).toString('hex')}`;

const LOG_LEVELS = ['info', 'warning', 'error', 'critical', 'debug'] as const;

/** Returns an aggregated count of logs per level for a given project in the current month */
const getMonthlyLogStats = async (projectId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const results = await Log.aggregate([
    { $match: { projectId: new (require('mongoose').Types.ObjectId)(projectId), timestamp: { $gte: startOfMonth } } },
    { $group: { _id: '$level', count: { $sum: 1 } } },
  ]);

  const stats: Record<string, number> = {};
  for (const level of LOG_LEVELS) stats[level] = 0;
  for (const r of results) stats[r._id] = r.count;
  stats.total = Object.values(stats).reduce((a, b) => a + b, 0);

  return stats;
};

// List projects — with monthly log stats
projectRoutes.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.find({ userId: req.user?.id }).sort({ createdAt: -1 }).lean();

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => ({
        ...project,
        monthlyLogStats: await getMonthlyLogStats(project._id.toString()),
      }))
    );

    res.json(projectsWithStats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
projectRoutes.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }

    const project = await Project.create({
      userId: req.user?.id,
      name,
      apiKey: generateApiKey(),
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get single project
projectRoutes.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user?.id }).lean();
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const monthlyLogStats = await getMonthlyLogStats(String(req.params.id));
    res.json({ ...project, monthlyLogStats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Delete project
projectRoutes.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    Log.deleteMany({ projectId: project._id }).catch(console.error);
    Workflow.deleteMany({ projectId: project._id }).catch(console.error);

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// List API keys for a project
projectRoutes.get('/:id/keys', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({
      apiKey: project.apiKey,
      // Mask all but the last 8 characters for display
      maskedApiKey: `lf_${'*'.repeat(20)}${project.apiKey.slice(-8)}`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch API key' });
  }
});

// Regenerate API Key
projectRoutes.post('/:id/keys', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    project.apiKey = generateApiKey();
    await project.save();

    res.json({ apiKey: project.apiKey });
  } catch (err) {
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});
