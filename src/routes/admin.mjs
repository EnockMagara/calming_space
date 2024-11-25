import express from 'express';
import { checkAdmin } from '../authMiddleware.mjs';
import { Message } from '../models/messages.mjs';

const router = express.Router();

// Route to get unapproved messages
router.get('/unapproved-messages', checkAdmin, async (req, res) => {
  try {
    const messages = await Message.find({ approved: false });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching unapproved messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unapproved messages.' });
  }
});

// Route to approve a message
router.post('/approve-message/:id', checkAdmin, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { approved: true });
    res.status(200).json({ success: true, message: 'Message approved.' });
  } catch (error) {
    console.error('Error approving message:', error);
    res.status(500).json({ success: false, message: 'Failed to approve message.' });
  }
});

export default router;