import express from 'express';
import { checkAuthenticated } from '../authMiddleware.mjs';
import { Music } from '../models/music.mjs';
import fetch from 'node-fetch'; 
import passport from 'passport';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const baseUrl = process.env.DOMAIN_NAME ? `https://${process.env.DOMAIN_NAME}` : `http://localhost:${process.env.PORT || 2113}`;

// Dashboard route
router.get('/dashboard', async (req, res) => {
  const username = req.user ? req.user.username : null;
  const userRole = req.user ? req.user.role : null;
  let accessToken = req.user ? req.user.accessToken : null;

  try {
    const musicList = await Music.find({});
    const isSpotifyAuthenticated = !!accessToken;
    let spotifyTracks = [];

    if (isSpotifyAuthenticated) {
      let spotifyResponse = await fetch('https://api.spotify.com/v1/me/tracks', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (spotifyResponse.status === 401) {
        // Refresh the access token if expired
        accessToken = await refreshAccessToken(req.user.refreshToken);
        req.user.accessToken = accessToken; // Update the user's access token

        // Retry fetching Spotify tracks with the new token
        spotifyResponse = await fetch('https://api.spotify.com/v1/me/tracks', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }

      if (spotifyResponse.ok) {
        const spotifyData = await spotifyResponse.json();
        spotifyTracks = spotifyData.items.slice(0, 10);
      } else {
        const errorDetails = await spotifyResponse.text();
        console.error('Failed to fetch Spotify tracks:', errorDetails);
      }
    }

    // Ensure baseUrl is defined and logged
    console.log(`Dashboard route rendering with baseUrl: ${baseUrl}`);

    res.render('dashboard.ejs', { 
      username, 
      userRole, 
      musicList, 
      spotifyTracks, 
      isSpotifyAuthenticated, 
      accessToken,
      baseUrl // Explicitly pass baseUrl
    });
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

// Add an API endpoint to get the Spotify token (for fallback)
router.get('/auth/spotify/token', checkAuthenticated, async (req, res) => {
  if (!req.user || !req.user.accessToken) {
    return res.status(401).json({ error: 'Not authenticated with Spotify' });
  }
  
  try {
    let accessToken = req.user.accessToken;
    
    // Check if token is valid by making a test request
    const testResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // If token expired, refresh it
    if (testResponse.status === 401 && req.user.refreshToken) {
      accessToken = await refreshAccessToken(req.user.refreshToken);
      req.user.accessToken = accessToken;
    }
    
    return res.json({ accessToken });
  } catch (error) {
    console.error('Error providing Spotify token:', error);
    return res.status(500).json({ error: 'Failed to provide Spotify token' });
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
