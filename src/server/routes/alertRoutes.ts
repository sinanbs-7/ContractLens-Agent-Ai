import { Router, Request, Response, NextFunction } from 'express';
import { scanAndGenerateAlerts, dismissAlert } from '../services/alertEngine.js';

const router = Router();

/**
 * GET /api/alerts/active
 * Triggers proactive deadline scan and returns active notifications.
 */
router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await scanAndGenerateAlerts();
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/alerts/:id/dismiss
 * Dismisses an active alert.
 */
router.patch('/:id/dismiss', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await dismissAlert(alertId);
    res.json({
      success: true,
      message: `Alert ${alertId} dismissed`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
