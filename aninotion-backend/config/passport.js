const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('./logger');

// Note: We're using JWT tokens, not sessions, so serialization is not needed
// The passport.authenticate() calls use { session: false } option

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info('Google OAuth callback received', {
          profileId: profile.id,
          email: profile.emails?.[0]?.value
        });

        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, update last login
          logger.info('Existing Google user found', {
            userId: user._id,
            email: user.email
          });
          
          await user.updateLastLogin();
          return done(null, user);
        }

        // Check if user exists with this email (local account)
        const email = profile.emails?.[0]?.value;
        if (!email) {
          logger.error('No email provided by Google OAuth');
          return done(new Error('No email provided by Google'), null);
        }

        user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          // Link existing local account with Google
          logger.info('Linking existing local account with Google', {
            userId: user._id,
            email: user.email
          });

          user.googleId = profile.id;
          user.authProvider = 'google';
          user.profilePicture = profile.photos?.[0]?.value;
          if (!user.name && profile.displayName) {
            user.name = profile.displayName;
          }
          await user.save();
          await user.updateLastLogin();
          
          return done(null, user);
        }

        // Create new user with Google OAuth
        logger.info('Creating new user via Google OAuth', {
          email,
          googleId: profile.id
        });

        user = new User({
          googleId: profile.id,
          email: email.toLowerCase(),
          name: profile.displayName || profile.name?.givenName || 'User',
          profilePicture: profile.photos?.[0]?.value,
          authProvider: 'google',
          role: 'viewer', // Default role for OAuth users
          status: 'active'
        });

        await user.save();
        await user.updateLastLogin();

        logger.info('New Google OAuth user created', {
          userId: user._id,
          email: user.email
        });

        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth error', {
          error: error.message,
          stack: error.stack
        });
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
