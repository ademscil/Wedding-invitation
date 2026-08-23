import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db';

/**
 * NextAuth refuses to run in production without a secret and reports it as a
 * generic `Configuration` error, which reaches the person signing in as
 * "check the server logs" and reaches the operator as nothing at all.
 * Naming the missing variable up front turns a dead end into a one-line fix.
 */
function resolveSecret(): string | undefined {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    console.error(
      '[auth] NEXTAUTH_SECRET is not set. Sign-in will fail with a ' +
        'Configuration error until it is added to the environment. ' +
        'Generate one with: openssl rand -base64 32'
    );
  }

  return secret;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  secret: resolveSecret(),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    newUser: '/dashboard',
    // Without this NextAuth falls back to its own page, which tells the person
    // signing in to "check the server logs" — advice they cannot act on.
    error: '/auth-error',
  },
  providers: [
    // Google provider is only registered when credentials are configured,
    // so NextAuth doesn't expose a broken "Sign in with Google" flow.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password wajib diisi');
        }

        // Emails are stored lower-cased at registration, so normalise here too.
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        if (!user || !user.hashedPassword) {
          throw new Error('Email atau password salah');
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error('Email atau password salah');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * Links a Google sign-in to an account that already exists for the same
     * address.
     *
     * Without this the Prisma adapter refuses the sign-in with
     * `OAuthAccountNotLinked`: anyone who registered with email and password
     * could never use the Google button afterwards, and the flow simply dead
     * ended on an error page.
     *
     * Linking is gated on Google reporting the address as verified, so the
     * person signing in has provably received mail at it. The local account is
     * marked verified at the same time, since that proof now exists.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return true;

      const email = user.email?.toLowerCase();
      const emailVerifiedByGoogle =
        (profile as { email_verified?: boolean } | undefined)?.email_verified === true;

      if (!email || !emailVerifiedByGoogle) return true;

      const existing = await prisma.user.findUnique({
        where: { email },
        include: { accounts: { select: { provider: true } } },
      });

      // No prior account, or Google is already linked — the adapter handles it.
      if (!existing) return true;
      if (existing.accounts.some((a) => a.provider === 'google')) return true;

      await prisma.account.create({
        data: {
          userId: existing.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state as string | undefined,
        },
      });

      if (!existing.emailVerified) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { emailVerified: new Date() },
        });
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.subscriptionTier = user.subscriptionTier;
      }

      /*
       * A Google sign-in goes through the adapter, which returns a user shaped
       * by NextAuth rather than our row, so role and tier can arrive undefined.
       * Filling them from the database keeps plan gating and admin access
       * working for OAuth accounts exactly as they do for password ones.
       */
      if (token.id && (token.role === undefined || token.subscriptionTier === undefined)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, subscriptionTier: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.subscriptionTier = dbUser.subscriptionTier;
        }
      }

      // Refresh subscriptionTier/role from DB after client calls session update() (e.g. post-payment)
      if (trigger === 'update' && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, subscriptionTier: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.subscriptionTier = dbUser.subscriptionTier;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.subscriptionTier = token.subscriptionTier;
      }
      return session;
    },
  },
};
