import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initialize } from './src/config/passport-config.mjs';
import authRoutes from './src/routes/auth.mjs';
import { connectDB } from './src/config/db.mjs';
import dashboardRoutes from './src/routes/dashboard.mjs';
import musicRoutes from './src/routes/music.mjs';
import adminRoutes from './src/routes/admin.mjs';
import { fileURLToPath } from 'url';

// Load environment variables
console.log('Loading environment variables...');
dotenv.config();
console.log('Environment variables loaded');

// Connect to the database
const isTestEnvironment = process.env.NODE_ENV === 'test';
if (!isTestEnvironment) {
  console.log('Connecting to MongoDB...');
  connectDB();
  console.log('MongoDB connection initiated');
}

const app = express();

// Initialize Passport
console.log('Initializing Passport...');
initialize(passport);
console.log('Passport initialized');

// Set up middleware
console.log('Setting up middleware...');
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
console.log('Middleware setup complete');

// Use authentication routes
console.log('Setting up routes...');
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/music', musicRoutes);
app.use('/admin', adminRoutes);
console.log('Routes setup complete');

// Define root route
app.get('/', (req, res) => {
  res.redirect('/dashboard'); // Redirect to dashboard page
});

// Set the views directory and view engine
console.log('Setting up view engine...');
app.set('views', './src/views');
app.set('view engine', 'ejs');
console.log('View engine setup complete');

// Serve static files from the 'public' directory
console.log('Setting up static files...');
app.use(express.static('public'));
console.log('Static files setup complete');

// Start server only if running directly (not in test environment)
if (!isTestEnvironment && process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 2113; // Use PORT from environment, default to 2113
  console.log(`Starting server on port ${port}...`);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

export { app };