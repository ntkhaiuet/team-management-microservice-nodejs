const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

module.exports = function (passport) {
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/google/callback",
      },
      (accessToken, refreshToken, profile, done) => {
        const user = {
          profile,
        };
        done(null, user);
      }
    )
  );
};
