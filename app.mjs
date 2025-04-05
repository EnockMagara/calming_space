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
import MongoStore from 'connect-mongo';

// Load environment variables
console.log('Loading environment variables...');
dotenv.config();

// Get domain configuration
const domain = process.env.DOMAIN_NAME || 'localhost';
const isProduction = domain !== 'localhost';
const baseUrl = isProduction ? `https://${domain}` : `http://${domain}:${process.env.PORT || 2113}`;

console.log(`Application configured for domain: ${domain}`);
console.log(`Base URL: ${baseUrl}`);

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

// Set up session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions' 
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: isProduction, // Only use secure cookies in production (HTTPS)
    sameSite: 'lax'
  }
};

// If in production, set domain for cookies
if (isProduction) {
  sessionConfig.cookie.domain = `.${domain.split('.').slice(-2).join('.')}`;
}

console.log('Setting up session middleware...');
app.use(session(sessionConfig));

// Set up middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// Set application variables
app.use((req, res, next) => {
  // Make baseUrl available to all templates
  res.locals.baseUrl = baseUrl;
  next();
});

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', './src/views');

// Use authentication routes
console.log('Setting up routes...');
app.use(authRoutes);
app.use(dashboardRoutes);
app.use(musicRoutes);
app.use(adminRoutes);

// Serve static files from the 'public' directory
console.log('Setting up static files...');
app.use(express.static('public'));

// For any non-matching route, redirect to dashboard
app.get('*', (req, res) => {
  res.redirect('/dashboard');
});

// Start server only if not in test environment
if (!isTestEnvironment) {
  const port = process.env.PORT || 2113; // Use PORT from environment, default to 2113
  console.log(`Starting server on port ${port}...`);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Application available at: ${baseUrl}`);
  });
}

export { app };