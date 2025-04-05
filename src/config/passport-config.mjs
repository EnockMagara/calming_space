import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../models/user.mjs'; 
import { Strategy as SpotifyStrategy } from 'passport-spotify';

// Initialize Passport
export function initialize(passport) {
  // Define authentication strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) return done(null, false);
      if (!await user.comparePassword(password)) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id)); // Serialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Use the environment variable for callback URL if available, otherwise use the default
  const callbackURL = process.env.SPOTIFY_CALLBACK_URL || `https://calmingspace.duckdns.org/auth/spotify/callback`;
  
  console.log('Using Spotify callback URL:', callbackURL);

  passport.use(new SpotifyStrategy({
    clientID: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    callbackURL: callbackURL
  },
  async (accessToken, refreshToken, expires_in, profile, done) => {
    try {
      console.log('Spotify Profile:', profile);
      console.log('Access Token:', accessToken);
      console.log('Refresh Token:', refreshToken);
      console.log('Using callback URL:', callbackURL);

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
