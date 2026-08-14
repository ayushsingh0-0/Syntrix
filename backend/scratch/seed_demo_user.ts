import prisma from '../src/config/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const email = 'alex@syntrix.com';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Alex Mercer',
        email,
        password: hashedPassword,
        isEmailVerified: true,
        bio: 'Lead System Architect & Core Platform Engineer',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      },
    });

    const org = await prisma.organization.create({
      data: {
        name: 'Syntrix Platform',
        slug: 'syntrix-platform',
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

    const team = await prisma.team.create({
      data: {
        organizationId: org.id,
        name: 'Core Engineering',
        description: 'Backend distributed systems & infrastructure engine',
      },
    });

    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: 'LEAD',
      },
    });

    const project = await prisma.project.create({
      data: {
        organizationId: org.id,
        teamId: team.id,
        name: 'Syntrix Core Engine',
        key: 'SYN',
        description: 'Primary high-throughput event processing and multi-tenant workspace platform',
        status: 'ACTIVE',
        priority: 'HIGH',
      },
    });

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: 'LEAD',
      },
    });

    console.log('SEED_SUCCESS: Created account and workspace.');
  } else {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log('SEED_SUCCESS: Password reset to Password123!');
  }
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
