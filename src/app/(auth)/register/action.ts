'use server';

import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return { error: 'Email sudah terdaftar' };
  }

  const hashedPassword = await hash(data.password, 12);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      hashedPassword,
    },
  });

  return { success: true };
}
