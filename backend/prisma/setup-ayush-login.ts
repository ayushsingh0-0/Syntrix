import prisma from '../src/config/prisma';
import bcrypt from 'bcrypt';
import { OrganizationRole, UserRole } from '../src/generated/prisma/client';

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const org = await prisma.organization.findUnique({
    where: { slug: 'syntrix-labs' },
  });

  if (!org) return;

  const emails = ['ayush@syntrix.io', 'ayush@syntrix.com'];

  for (const email of emails) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: 'Ayush Singh',
        password: passwordHash,
        role: UserRole.ADMIN,
        isEmailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Lead System Architect & Founder — Distributed Systems, Node.js, MariaDB & Redis',
      },
      create: {
        name: 'Ayush Singh',
        email,
        password: passwordHash,
        role: UserRole.ADMIN,
        isEmailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Lead System Architect & Founder — Distributed Systems, Node.js, MariaDB & Redis',
      },
    });

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      update: { role: OrganizationRole.OWNER },
      create: {
        organizationId: org.id,
        userId: user.id,
        role: OrganizationRole.OWNER,
      },
    });

    console.log(`✅ Configured login: ${email} (Password: Password123!) as OWNER of ${org.name}`);
  }
}

main().finally(() => prisma.$disconnect());
