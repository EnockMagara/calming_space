import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initialize } from './src/config/passport-config.mjs';
import authRoutes from './src/routes/auth.mjs';
import connectDB from './src/config/db.mjs';
import dashboardRoutes from './src/routes/dashboard.mjs';
import musicRoutes from './src/routes/music.mjs';
import { gfs, upload } from './src/config/gridfs.mjs';
import messagesRoutes from './src/routes/messages.mjs';

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const app = express();

// Initialize Passport
initialize(passport);

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// Use authentication routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/music', musicRoutes);
app.use('/api', messagesRoutes);

// Define root route
app.get('/', (req, res) => {
  res.redirect('/login'); // Redirect to login page
});

// Set the views directory and view engine
app.set('views', './src/views'); // Correct path to your views directory
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
