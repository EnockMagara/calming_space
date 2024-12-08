import express from 'express';
import { checkAuthenticated } from '../authMiddleware.mjs';
import { Music } from '../models/music.mjs';
import fetch from 'node-fetch'; 
import passport from 'passport';

const router = express.Router();

// Dashboard route
router.get('/dashboard', async (req, res) => {
  const username = req.user ? req.user.username : null;
  const userRole = req.user ? req.user.role : null;

  try {
    const musicList = await Music.find({});

    // Determine if the user is authenticated with Spotify
    const isSpotifyAuthenticated = req.user && req.user.accessToken;

    // Initialize spotifyTracks as an empty array
    let spotifyTracks = [];

    // Fetch Spotify tracks only if the user is authenticated with Spotify
    if (isSpotifyAuthenticated) {
      const spotifyResponse = await fetch('https://api.spotify.com/v1/me/tracks', {
        headers: {
          'Authorization': `Bearer ${req.user.accessToken}`
        }
      });

      if (spotifyResponse.ok) {
        const spotifyData = await spotifyResponse.json();
        spotifyTracks = spotifyData.items.slice(0, 5); // Limit to top 5 tracks
      } else {
        const errorDetails = await spotifyResponse.text();
        console.error('Failed to fetch Spotify tracks:', errorDetails);
      }
    }

    res.render('dashboard.ejs', { username, userRole, musicList, spotifyTracks, isSpotifyAuthenticated });
  } catch (error) {
    console.error('Error loading dashboard:', error);
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

async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  return data.access_token;
}

router.get('/auth/spotify', passport.authenticate('spotify', {
  scope: ['user-read-email', 'user-read-private', 'user-library-read', 'streaming']
}));

export default router;
