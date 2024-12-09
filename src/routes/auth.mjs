import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { User } from '../models/user.mjs'; // Import User model
import { checkAuthenticated, checkNotAuthenticated } from '../authMiddleware.mjs'; // Import middleware

const router = express.Router();

// Login route
router.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs'); // Render login view
});

router.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/dashboard', // Redirect on success
  failureRedirect: '/login', // Redirect on failure
  failureFlash: true,
}));

// Register route
router.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs', { error: null }); 
});

router.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Registering user:', username); 

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Username already exists:', username); 
      return res.render('register.ejs', { error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
    });

    console.log('Saving user to database:', user); 
    await user.save();
    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err); 
    res.render('register.ejs', { error: 'Registration failed. Please try again.' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.logOut(() => {
    res.redirect('/dashboard'); // Redirect to dashboard on logout
  });
});

// Spotify login route
router.get('/auth/spotify', passport.authenticate('spotify', {
  scope: ['user-read-email', 'user-read-private', 'user-library-read', 'streaming']
}));

// Spotify callback route
router.get('/auth/spotify/callback', passport.authenticate('spotify', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/dashboard'); // Redirect to dashboard on successful login
});

export default router;
