import { Router } from 'express';
import crypto from 'crypto';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';

const router = Router();

router.post('/sign', authenticate, requireRole('TEACHER'), (req, res) => {
  const { timestamp } = req.body as { timestamp?: unknown };

  if (typeof timestamp !== 'string' || !/^\d+$/.test(timestamp)) {
    res.status(400).json({ error: 'timestamp must be a numeric string' });
    return;
  }

  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    res.status(503).json({ error: 'Upload service is not configured' });
    return;
  }

  const signature = crypto
    .createHash('sha256')
    .update(`timestamp=${timestamp}${secret}`)
    .digest('hex');

  res.json({ signature });
});

export default router;
