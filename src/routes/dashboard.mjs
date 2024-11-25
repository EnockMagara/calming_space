import express from 'express';
import { checkAuthenticated } from '../authMiddleware.mjs';
import { Music } from '../models/music.mjs';

const router = express.Router();

// Dashboard route
router.get('/dashboard', checkAuthenticated, async (req, res) => {
  const username = req.user.username;
  const userRole = req.user.role;

  try {
    const musicList = await Music.find({});
    res.render('dashboard.ejs', { username, userRole, musicList });
  } catch (error) {
    console.error('Error fetching music list:', error);
    res.status(500).send('Error loading dashboard');
  }
});

export default router;
