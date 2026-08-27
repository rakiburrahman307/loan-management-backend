import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import config from '.';
import { User } from '../app/modules/user/user.model';
import { jwtHelper } from '../helpers/jwtHelper';

// Google OAuth Strategy
passport.use(
     new GoogleStrategy(
          {
               clientID: config.social.google_client_id as string,
               clientSecret: config.social.google_client_secret as string,
               callbackURL:
                    config.social.callback_url ||
                    'https://nadir.binarybards.online/api/v1/auth/google/callback',
          },
          async (accessToken, refreshToken, profile, done) => {
               try {
                    console.log('Google Profile:', profile);

                    // Check if user exists by Google ID
                    let user = await User.findOne({ googleId: profile.id });

                    if (!user) {
                         // Check if user exists by email
                         user = await User.findOne({ email: profile.emails?.[0]?.value });

                         if (user) {
                              // Update existing user with Google ID
                              user.googleId = profile.id;
                              user.oauthProvider = 'google';
                              user.isVerified = true;
                              await user.save();
                         } else {
                              // Create new user
                              user = await User.create({
                                   googleId: profile.id,
                                   name: profile.displayName,
                                   email: profile.emails?.[0]?.value,
                                   image: profile.photos?.[0]?.value,
                                   oauthProvider: 'google',
                                   isVerified: true,
                              });
                         }
                    }

                    done(null, user);
               } catch (error) {
                    console.error('Google OAuth Error:', error);
                    done(error, undefined);
               }
          },
     ),
);

// Facebook OAuth Strategy
passport.use(
     new FacebookStrategy(
          {
               clientID: config.social.facebook_client_id as string,
               clientSecret: config.social.facebook_client_secret as string,
               callbackURL: '/auth/facebook/callback',
               profileFields: ['id', 'displayName', 'emails', 'photos'],
          },
          async (accessToken, refreshToken, profile, done) => {
               try {
                    console.log('Facebook Profile:', profile);

                    // Check if user exists by Facebook ID
                    let user = await User.findOne({ facebookId: profile.id });

                    if (!user) {
                         // Check if user exists by email
                         user = await User.findOne({ email: profile.emails?.[0]?.value });

                         if (user) {
                              // Update existing user with Facebook ID
                              user.facebookId = profile.id;
                              user.oauthProvider = 'facebook';
                              user.isVerified = true;
                              await user.save();
                         } else {
                              // Create new user
                              user = await User.create({
                                   facebookId: profile.id,
                                   name: profile.displayName,
                                   email: profile.emails?.[0]?.value,
                                   image: profile.photos?.[0]?.value,
                                   oauthProvider: 'facebook',
                                   isVerified: true,
                              });
                         }
                    }

                    done(null, user);
               } catch (error) {
                    console.error('Facebook OAuth Error:', error);
                    done(error, null);
               }
          },
     ),
);

// Serialize & Deserialize User
passport.serializeUser((user: any, done) => {
     done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
     try {
          const user = await User.findById(id);
          done(null, user);
     } catch (error) {
          done(error, null);
     }
});

export default passport;
