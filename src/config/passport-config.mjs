import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { User } from '../models/user.mjs'; 

// Initialize Passport
export function initialize(passport) {
  // Define authentication strategy
  const authenticateUser = async (username, password, done) => {
    const user = await User.findOne({ username }); // Find user by username
    if (!user) {
      return done(null, false, { message: 'No user with that username' });
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user); // Password matches
      } else {
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (e) {
      return done(e);
    }
  };

  passport.use(new LocalStrategy(authenticateUser));
  passport.serializeUser((user, done) => done(null, user.id)); // Serialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id); // Use await to handle the promise
      done(null, user); // Pass the user to done
    } catch (err) {
      done(err); // Pass any error to done
    }
  });
}
