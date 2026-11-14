import express from 'express';
import { Notification } from '../models/Notification.js';

const router = express.Router();

// Helper to create and persist a notification
export async function dispatchNotification({
  recipient_id,
  recipient_role,
  sender_id,
  sender_name,
  sender_role,
  type,
  title,
  message,
  document_id,
  document_title,
  study_id,
  site_id,
  action_url
}) {
  try {
    const notif = new Notification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipient_id,
      recipient_role,
      sender_id,
      sender_name,
      sender_role,
      type,
      title,
      message,
      document_id,
      document_title,
      study_id,
      site_id,
      action_url: action_url || '/explorer'
    });
    return await notif.save();
  } catch (err) {
    console.warn('[Notification Error]', err.message);
    return null;
  }
}

// GET /api/notifications - List notifications
router.get('/', async (req, res) => {
  try {
    const { userId, roleId, studyId, unreadOnly } = req.query;
    const filter = {};

    if (userId && roleId) {
      filter.$or = [
        { recipient_id: userId },
        { recipient_role: roleId },
        { recipient_role: 'ALL' }
      ];
    } else if (userId) {
      filter.recipient_id = userId;
    } else if (roleId) {
      filter.recipient_role = roleId;
    }

    if (studyId && studyId !== 'ALL') {
      filter.study_id = studyId;
    }

    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ ...filter, read: false });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { id: req.params.id },
      { read: true },
      { new: true }
    );
    if (!notif) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const filter = { read: false };
    if (userId || roleId) {
      filter.$or = [
        ...(userId ? [{ recipient_id: userId }] : []),
        ...(roleId ? [{ recipient_role: roleId }] : [])
      ];
    }
    await Notification.updateMany(filter, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
