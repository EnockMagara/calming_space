import express from 'express';
import { checkAuthenticated } from '../authMiddleware.mjs';
import { Message } from '../models/messages.mjs'; 

const router = express.Router();

// Route to handle message submission
router.post('/messages', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { message } = req.body;
    const newMessage = new Message({ text: message, user: req.user.id });
    await newMessage.save();
    res.status(200).json({ success: true, message: 'Message shared successfully!' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ success: false, message: 'Failed to share message.' });
  }
});

// Route to fetch a random kind message
router.get('/random-message', async (req, res) => {
  try {
    const messages = await Message.find();
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    res.status(200).json({ success: true, message: randomMessage.text });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch message.' });
  }
});

export default router;
