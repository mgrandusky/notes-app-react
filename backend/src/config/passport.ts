import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { prisma } from './database';
import { env } from './env';

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          username: true,
          email: true,
          profilePicture: true,
          aiPreferences: true,
          createdAt: true,
        },
      });

      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { email },
                { oauthProvider: 'google', oauthId: profile.id },
              ],
            },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                username: profile.displayName || email.split('@')[0],
                oauthProvider: 'google',
                oauthId: profile.id,
                profilePicture: profile.photos?.[0]?.value,
              },
            });
          } else if (!user.oauthProvider) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                oauthProvider: 'google',
                oauthId: profile.id,
                profilePicture: profile.photos?.[0]?.value || user.profilePicture,
              },
            });
          }

          return done(null, user as Express.User);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_CALLBACK_URL) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in GitHub profile'));
          }

          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { email },
                { oauthProvider: 'github', oauthId: profile.id },
              ],
            },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                username: profile.username || email.split('@')[0],
                oauthProvider: 'github',
                oauthId: profile.id,
                profilePicture: profile.photos?.[0]?.value,
              },
            });
          } else if (!user.oauthProvider) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                oauthProvider: 'github',
                oauthId: profile.id,
                profilePicture: profile.photos?.[0]?.value || user.profilePicture,
              },
            });
          }

          return done(null, user as Express.User);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user as Express.User | null);
  } catch (error) {
    done(error);
  }
});

export default passport;
