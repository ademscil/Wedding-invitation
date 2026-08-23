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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.subscriptionTier = user.subscriptionTier;
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
