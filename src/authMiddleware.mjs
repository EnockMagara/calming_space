// Middleware to check if user is authenticated
export function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // Proceed if authenticated
  }
  res.redirect('/login'); // Redirect to login if not authenticated
}

// Alias for checkAuthenticated for better naming consistency
export const ensureAuthenticated = checkAuthenticated;

// Middleware to check if user is not authenticated
export function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard'); // Redirect to dashboard if authenticated
  }
  next(); // Proceed if not authenticated
}

// Middleware to check if user is an admin
export function checkAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.redirect('/login'); // Redirect to login if not admin
}
