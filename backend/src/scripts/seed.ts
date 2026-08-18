import prisma from '../config/prisma';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Starting Syntrix database seed...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create or ensure Core Users
  const usersData = [
    {
      name: 'Ayush Singh',
      email: 'ayush@syntrix.io',
      role: 'ADMIN' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Elena Rostova',
      email: 'elena@syntrix.io',
      role: 'USER' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus@syntrix.io',
      role: 'USER' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sarah Chen',
      email: 'sarah@syntrix.io',
      role: 'USER' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Devon Miles',
      email: 'devon@syntrix.io',
      role: 'USER' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, avatarUrl: u.avatarUrl },
      create: {
        name: u.name,
        email: u.email,
        password: passwordHash,
        role: u.role,
        isEmailVerified: true,
        avatarUrl: u.avatarUrl,
      },
    });
    createdUsers.push(user);
  }

  const primaryUser = createdUsers[0];

  // 2. Find or create Organization
  let org = await prisma.organization.findFirst({
    where: { members: { some: { userId: primaryUser.id } } },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Syntrix Technologies',
        slug: 'syntrix-technologies',
      },
    });
  }

  // 3. Add members to Organization
  const orgRoles = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'MEMBER'] as const;
  for (let i = 0; i < createdUsers.length; i++) {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: createdUsers[i].id,
        },
      },
      update: { role: orgRoles[i] },
      create: {
        organizationId: org.id,
        userId: createdUsers[i].id,
        role: orgRoles[i],
      },
    });
  }

  // 4. Create Functional Teams
  const teamsData = [
    { name: 'Core Platform', description: 'Backend distributed systems, databases & APIs' },
    { name: 'Design & Experience', description: 'Product UI design system, web client, and animations' },
    { name: 'Mobile Guild', description: 'iOS and Android client applications' },
    { name: 'Security & Reliability', description: 'Audit compliance, zero-trust security & monitoring' },
  ];

  const createdTeams = [];
  for (const t of teamsData) {
    let team = await prisma.team.findFirst({
      where: { organizationId: org.id, name: t.name },
    });
    if (!team) {
      team = await prisma.team.create({
        data: {
          organizationId: org.id,
          name: t.name,
          description: t.description,
        },
      });
    }
    createdTeams.push(team);
  }

  // 5. Create Projects
  const projectsData = [
    {
      name: 'Design System & Syntrix 2.0',
      key: 'SYN',
      description: 'Modernize frontend design tokens, Bklit charts, warm amber aesthetic, and motion primitives.',
      status: 'ACTIVE' as const,
      priority: 'URGENT' as const,
      teamId: createdTeams[1].id,
    },
    {
      name: 'Real-time Collaboration Engine',
      key: 'RTE',
      description: 'WebSocket multi-user presence, CRDT comments, and live cursor indicators.',
      status: 'ACTIVE' as const,
      priority: 'HIGH' as const,
      teamId: createdTeams[0].id,
    },
    {
      name: 'Mobile Client & Offline Sync',
      key: 'MOB',
      description: 'Native mobile client with background caching and bidirectional queue sync.',
      status: 'ACTIVE' as const,
      priority: 'MEDIUM' as const,
      teamId: createdTeams[2].id,
    },
    {
      name: 'Enterprise Security & Audit Log',
      key: 'SEC',
      description: 'RBAC authorization matrix, daily log rotation, and intrusion detection.',
      status: 'COMPLETED' as const,
      priority: 'HIGH' as const,
      teamId: createdTeams[3].id,
    },
  ];

  const createdProjects = [];
  for (const p of projectsData) {
    let proj = await prisma.project.findUnique({
      where: {
        organizationId_key: {
          organizationId: org.id,
          key: p.key,
        },
      },
    });

    if (!proj) {
      proj = await prisma.project.create({
        data: {
          organizationId: org.id,
          name: p.name,
          key: p.key,
          description: p.description,
          status: p.status,
          priority: p.priority,
          teamId: p.teamId,
        },
      });

      // Create default Kanban board & columns
      const board = await prisma.board.create({
        data: {
          projectId: proj.id,
          name: `${p.name} Board`,
          isDefault: true,
        },
      });

      const cols = [
        { name: 'To Do', pos: 0, color: '#9A978D' },
        { name: 'In Progress', pos: 1, color: '#F5AE4D' },
        { name: 'Review', pos: 2, color: '#D9963D' },
        { name: 'Done', pos: 3, color: '#719879' },
      ];

      for (const c of cols) {
        await prisma.boardColumn.create({
          data: {
            boardId: board.id,
            name: c.name,
            position: c.pos,
            color: c.color,
          },
        });
      }
    }
    createdProjects.push(proj);
  }

  // 6. Populate Realistic Tasks across the last 30 days
  const taskTemplates = [
    { title: 'Implement Motion Primitives TextEffect', status: 'DONE', priority: 'URGENT', pts: 5, daysAgo: 1, projectIdx: 0, userIdx: 0 },
    { title: 'Refactor BarChart with Spring Animations', status: 'DONE', priority: 'HIGH', pts: 8, daysAgo: 1, projectIdx: 0, userIdx: 1 },
    { title: 'Warm bone-white color tokens integration', status: 'DONE', priority: 'HIGH', pts: 3, daysAgo: 2, projectIdx: 0, userIdx: 0 },
    { title: 'Multi-tenant database schema migrations', status: 'DONE', priority: 'MEDIUM', pts: 5, daysAgo: 3, projectIdx: 0, userIdx: 2 },
    { title: 'Redis Cache-Aside Layer for Dashboard', status: 'DONE', priority: 'HIGH', pts: 5, daysAgo: 4, projectIdx: 1, userIdx: 3 },
    { title: 'Winston daily log rotation & security audit', status: 'DONE', priority: 'HIGH', pts: 3, daysAgo: 5, projectIdx: 3, userIdx: 4 },
    { title: 'Kanban drag-and-drop column positioning', status: 'DONE', priority: 'MEDIUM', pts: 8, daysAgo: 6, projectIdx: 0, userIdx: 1 },
    { title: 'Sprint capacity burn-down calculations', status: 'DONE', priority: 'HIGH', pts: 5, daysAgo: 7, projectIdx: 0, userIdx: 2 },
    { title: 'OpenAPI 3.1 Swagger docs generation', status: 'DONE', priority: 'LOW', pts: 2, daysAgo: 8, projectIdx: 0, userIdx: 0 },
    { title: 'Email verification & password reset flows', status: 'DONE', priority: 'HIGH', pts: 5, daysAgo: 10, projectIdx: 3, userIdx: 3 },
    { title: 'Tenant isolation query enforcement audit', status: 'DONE', priority: 'URGENT', pts: 8, daysAgo: 12, projectIdx: 3, userIdx: 4 },
    { title: 'Optimistic UI state updates for tasks', status: 'DONE', priority: 'MEDIUM', pts: 5, daysAgo: 14, projectIdx: 0, userIdx: 1 },
    { title: 'WebSocket connection heartbeat & reconnect', status: 'DONE', priority: 'HIGH', pts: 8, daysAgo: 18, projectIdx: 1, userIdx: 2 },
    { title: 'Mobile push notification integration', status: 'DONE', priority: 'LOW', pts: 3, daysAgo: 22, projectIdx: 2, userIdx: 4 },
    { title: 'BullMQ async event processing queues', status: 'DONE', priority: 'HIGH', pts: 5, daysAgo: 25, projectIdx: 1, userIdx: 3 },
    { title: 'Database connection pool optimization', status: 'DONE', priority: 'MEDIUM', pts: 3, daysAgo: 28, projectIdx: 0, userIdx: 0 },
    // Active tasks in flight
    { title: 'Live cursor collaboration overlay', status: 'IN_PROGRESS', priority: 'URGENT', pts: 8, daysAgo: 2, projectIdx: 1, userIdx: 1 },
    { title: 'Task detail slide-over drawer animation', status: 'IN_PROGRESS', priority: 'HIGH', pts: 5, daysAgo: 3, projectIdx: 0, userIdx: 0 },
    { title: 'Offline sync SQLite indexed cache', status: 'IN_PROGRESS', priority: 'MEDIUM', pts: 8, daysAgo: 4, projectIdx: 2, userIdx: 4 },
    { title: 'Global Cmd+K search modal indexer', status: 'REVIEW', priority: 'HIGH', pts: 5, daysAgo: 1, projectIdx: 0, userIdx: 3 },
    { title: 'Role-based access permission gates', status: 'REVIEW', priority: 'HIGH', pts: 5, daysAgo: 2, projectIdx: 3, userIdx: 2 },
    { title: 'Export dashboard reports to CSV/PDF', status: 'TODO', priority: 'LOW', pts: 3, daysAgo: 5, projectIdx: 0, userIdx: 1 },
    { title: 'Dark mode contrast accessibility review', status: 'TODO', priority: 'MEDIUM', pts: 2, daysAgo: 3, projectIdx: 0, userIdx: 0 },
    { title: 'Custom webhook triggers on task done', status: 'TODO', priority: 'LOW', pts: 5, daysAgo: 6, projectIdx: 1, userIdx: 3 },
  ];

  for (let i = 0; i < taskTemplates.length; i++) {
    const t = taskTemplates[i];
    const targetProject = createdProjects[t.projectIdx];
    const assignee = createdUsers[t.userIdx];

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - t.daysAgo);
    pastDate.setMinutes(pastDate.getMinutes() - i * 15);

    const taskNumber = i + 1;
    const taskKey = `${targetProject.key}-${taskNumber}`;

    const existing = await prisma.task.findUnique({
      where: {
        projectId_number: {
          projectId: targetProject.id,
          number: taskNumber,
        },
      },
    });

    if (!existing) {
      await prisma.task.create({
        data: {
          projectId: targetProject.id,
          number: taskNumber,
          key: taskKey,
          title: t.title,
          status: t.status as any,
          priority: t.priority as any,
          storyPoints: t.pts,
          assigneeId: assignee.id,
          reporterId: primaryUser.id,
          createdAt: pastDate,
          updatedAt: t.status === 'DONE' ? pastDate : new Date(),
        },
      });

      // Create activity log entry
      await prisma.activityLog.create({
        data: {
          organizationId: org.id,
          projectId: targetProject.id,
          userId: assignee.id,
          action: t.status === 'DONE' ? 'STATUS_CHANGED' : 'TASK_UPDATED',
          createdAt: pastDate,
          details: { title: t.title, key: taskKey },
        },
      });
    }
  }

  console.log('✅ Syntrix database successfully seeded with realistic multi-day analytics data!');
}

seed()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
