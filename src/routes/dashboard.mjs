import express from 'express';
import { checkAuthenticated } from '../authMiddleware.mjs';

const router = express.Router();

// Dashboard route
router.get('/dashboard', checkAuthenticated, (req, res) => {
  const username = req.user.username;
  const userRole = req.user.role;
  res.render('dashboard.ejs', { username, userRole });
});

export default router;
