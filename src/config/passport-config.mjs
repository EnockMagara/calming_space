import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { User } from '../models/user.mjs'; 
import { Strategy as SpotifyStrategy } from 'passport-spotify';

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
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passport.use(new SpotifyStrategy({
    clientID: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/spotify/callback'
  },
  async (accessToken, refreshToken, expires_in, profile, done) => {
    try {
      console.log('Spotify Profile:', profile);
      console.log('Access Token:', accessToken);
      console.log('Refresh Token:', refreshToken);

      let user = await User.findOne({ spotifyId: profile.id });
      if (!user) {
        user = new User({
          spotifyId: profile.id,
          username: profile.displayName,
          accessToken,
          refreshToken
        });
        await user.save();
        console.log('New user created:', user);
      } else {
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
        console.log('User updated with new tokens:', user);
      }
      return done(null, user);
    } catch (err) {
      console.error('Error in Spotify Strategy:', err);
      return done(err, null);
    }
  }));
}
