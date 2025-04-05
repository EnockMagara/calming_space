import express from 'express';
import passport from 'passport';
import { User } from '../models/user.mjs'; // Import User model
import { checkAuthenticated, checkNotAuthenticated } from '../authMiddleware.mjs'; // Import middleware
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const baseUrl = process.env.DOMAIN_NAME ? `https://${process.env.DOMAIN_NAME}` : 'http://localhost:2113';

// Login route
router.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs', { baseUrl });
});

router.post('/login', checkNotAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.render('login.ejs', { error: 'Invalid username or password', baseUrl });
    req.logIn(user, (err) => {
      if (err) return next(err);
      // Use domain name URL for redirection
      return res.redirect(`${baseUrl}/dashboard`);
    });
  })(req, res, next);
});

// Register route
router.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs', { baseUrl });
});

router.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Registering user:', username); 

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Username already exists:', username); 
      return res.render('register.ejs', { error: 'Username already exists', baseUrl });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
    });

    console.log('Saving user to database:', user); 
    await user.save();
    res.redirect(`${baseUrl}/login`);
  } catch (err) {
    console.error('Registration error:', err); 
    res.render('register.ejs', { error: 'Registration failed. Please try again.', baseUrl });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    // Use domain name URL for redirection
    res.redirect(`${baseUrl}/login`);
  });
});

// Spotify login route
router.get('/auth/spotify', passport.authenticate('spotify', {
  scope: ['user-read-email', 'user-read-private', 'user-library-read', 'streaming']
}));

// Spotify callback route
router.get('/auth/spotify/callback', passport.authenticate('spotify', {
  failureRedirect: `${baseUrl}/login`
}), (req, res) => {
  res.redirect(`${baseUrl}/dashboard`); // Redirect to dashboard on successful login
});

export default router;
