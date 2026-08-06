'use server';

import { hash } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validations/auth';
import { sendEmail, verificationEmail } from '@/lib/email';
import {
  createVerificationToken,
  buildVerificationUrl,
} from '@/server/lib/verification';

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}) {
  // Server actions are callable directly, so the client-side resolver is not
  // a guarantee — re-validate here.
  const parsed = registerSchema.safeParse({
    ...data,
    confirmPassword: data.confirmPassword ?? data.password,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Data pendaftaran tidak valid',
    };
  }

  const name = parsed.data.name.trim();
  // Normalise the email so casing variants can't create duplicate accounts
  // that then fail to log in.
  const email = parsed.data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return { error: 'Email sudah terdaftar' };
  }

  const hashedPassword = await hash(parsed.data.password, 12);

  try {
    await prisma.user.create({
      data: { name, email, hashedPassword },
    });

    // Verification is not required to sign in, so a mail failure must not fail
    // the signup — the user can resend from the dashboard.
    const token = await createVerificationToken(prisma, email);
    await sendEmail({
      to: email,
      subject: 'Verifikasi email WedInvite Anda',
      html: verificationEmail({ name, url: buildVerificationUrl(token) }),
    }).catch((mailError) => {
      console.error('[register] Verification email failed:', mailError);
    });
  } catch (error) {
    // Two concurrent signups for the same email: the unique index is the
    // real arbiter, the check above is only a fast path.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return { error: 'Email sudah terdaftar' };
    }
    console.error('[register] Failed to create user:', error);
    return { error: 'Gagal membuat akun. Silakan coba lagi.' };
  }

  return { success: true };
}
