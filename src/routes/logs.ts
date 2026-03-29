import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { Log } from '../models/Log';
import { Project } from '../models/Project';

export const logsRoutes = Router();

logsRoutes.use('/:projectId/logs', requireAuth);

logsRoutes.get('/:projectId/logs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Verify user owns project
    const project = await Project.findOne({ _id: projectId, userId: req.user?.id });
    if (!project) {
       res.status(404).json({ error: 'Project not found or access denied' });
       return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const filter: any = { projectId };
    if (req.query.level) {
      filter.level = req.query.level;
    }
    if (req.query.environment) {
      filter.environment = req.query.environment;
    }

    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Log.countDocuments(filter);

    res.json({
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});
