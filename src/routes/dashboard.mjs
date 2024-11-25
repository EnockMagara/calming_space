import express from 'express';
import { checkAuthenticated } from '../authMiddleware.mjs';
import { Music } from '../models/music.mjs';
import fetch from 'node-fetch'; 

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

// New endpoint to fetch random quotes
router.get('/api/random-quotes', async (req, res) => {
  try {
    const response = await fetch('https://zenquotes.io/api/random');
    const quotes = await response.json();
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotes.' });
  }
});

export default router;
