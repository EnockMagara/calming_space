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
  res.render('register.ejs', { error: null }); // Render register view with no error
});

router.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Registering user:', username); // Log the username being registered

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Username already exists:', username); // Log if username exists
      return res.render('register.ejs', { error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
    });

    console.log('Saving user to database:', user); // Log the user object before saving
    await user.save();
    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err); // Log the error
    res.render('register.ejs', { error: 'Registration failed. Please try again.' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.logOut(() => {
    res.redirect('/login'); // Redirect to login on logout
  });
});

export default router;
