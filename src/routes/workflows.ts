import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { Workflow } from '../models/Workflow';
import { Project } from '../models/Project';

export const workflowRoutes = Router();

workflowRoutes.use('/:projectId/workflows', requireAuth);

// List Workflows
workflowRoutes.get('/:projectId/workflows', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ _id: projectId, userId: req.user?.id });
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }

    const workflows = await Workflow.find({ projectId }).sort({ createdAt: -1 });
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Create Workflow
workflowRoutes.post('/:projectId/workflows', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ _id: projectId, userId: req.user?.id });
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }

    const { triggerLevel, providerType, providerConfig, isActive } = req.body;

    if (!triggerLevel || !providerType || !providerConfig) {
        res.status(400).json({ error: 'Missing required fields for workflow' });
        return;
    }

    const workflow = await Workflow.create({
      projectId,
      triggerLevel,
      providerType,
      providerConfig,
      isActive: isActive !== false,
    });

    res.status(201).json(workflow);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Get Single Workflow
workflowRoutes.get('/:projectId/workflows/:workflowId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, workflowId } = req.params;
    const project = await Project.findOne({ _id: projectId, userId: req.user?.id });
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }

    const workflow = await Workflow.findOne({ _id: workflowId, projectId });
    if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
    }

    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// Edit Workflow
workflowRoutes.patch('/:projectId/workflows/:workflowId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, workflowId } = req.params;
    const project = await Project.findOne({ _id: projectId, userId: req.user?.id });
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }

    const updates = req.body;
    // Prevent changing the projectId
    delete updates.projectId;

    const workflow = await Workflow.findOneAndUpdate(
      { _id: workflowId, projectId },
      { $set: updates },
      { new: true }
    );

    if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
    }

    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Delete Workflow
workflowRoutes.delete('/:projectId/workflows/:workflowId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, workflowId } = req.params;
    const project = await Project.findOne({ _id: projectId, userId: req.user?.id });
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }

    const workflow = await Workflow.findOneAndDelete({ _id: workflowId, projectId });
    if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
    }

    res.json({ message: 'Workflow deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});
