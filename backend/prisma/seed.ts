import { UserRole, OrganizationRole, TeamRole, ProjectRole, ProjectStatus, ProjectPriority, TaskStatus, TaskPriority, SprintStatus } from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma';


async function main() {
  console.log('🌱 Starting comprehensive Syntrix database seeding...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create or upsert primary users
  const usersData = [
    {
      name: 'Ayush Singh',
      email: 'ayush@syntrix.io',
      role: UserRole.ADMIN,
      bio: 'Founder & Principal Engineer @ Syntrix Labs',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Elena Rostova',
      email: 'elena@syntrix.io',
      role: UserRole.MANAGER,
      bio: 'VP of Engineering & Distributed Systems Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus@syntrix.io',
      role: UserRole.USER,
      bio: 'Senior Fullstack Architect (Node/React/TypeScript)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sophia Chen',
      email: 'sophia@syntrix.io',
      role: UserRole.USER,
      bio: 'Lead Product Designer & Design System Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'David Kim',
      email: 'david@syntrix.io',
      role: UserRole.USER,
      bio: 'Site Reliability Engineer & Kubernetes Enthusiast',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Aisha Patel',
      email: 'aisha@syntrix.io',
      role: UserRole.USER,
      bio: 'Senior QA Automation & Test Infrastructure Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        isEmailVerified: true,
      },
      create: {
        name: u.name,
        email: u.email,
        password: passwordHash,
        role: u.role,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        isEmailVerified: true,
      },
    });
    createdUsers[u.email] = user;
  }

  console.log(`✅ Seeded ${Object.keys(createdUsers).length} users`);

  // 2. Primary Organization: Syntrix Labs
  const org = await prisma.organization.upsert({
    where: { slug: 'syntrix-labs' },
    update: {
      name: 'Syntrix Labs Inc.',
    },
    create: {
      name: 'Syntrix Labs Inc.',
      slug: 'syntrix-labs',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log(`✅ Organization configured: ${org.name}`);

  // 3. Organization Memberships
  const memberRoles = [
    { email: 'ayush@syntrix.io', role: OrganizationRole.OWNER },
    { email: 'elena@syntrix.io', role: OrganizationRole.ADMIN },
    { email: 'marcus@syntrix.io', role: OrganizationRole.MANAGER },
    { email: 'sophia@syntrix.io', role: OrganizationRole.MEMBER },
    { email: 'david@syntrix.io', role: OrganizationRole.MEMBER },
    { email: 'aisha@syntrix.io', role: OrganizationRole.MEMBER },
  ];

  for (const mr of memberRoles) {
    const u = createdUsers[mr.email];
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: u.id,
        },
      },
      update: { role: mr.role },
      create: {
        organizationId: org.id,
        userId: u.id,
        role: mr.role,
      },
    });
  }

  // 4. Create Organization Teams
  const teamsData = [
    { name: 'Core Platform Engineering', description: 'Distributed systems, API gateways, and database performance' },
    { name: 'Product Experience', description: 'Design systems, micro-frontends, and client accessibility' },
    { name: 'Infrastructure & SRE', description: 'Kubernetes orchestration, CI/CD pipelines, and observability' },
  ];

  const createdTeams: Record<string, any> = {};
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
    createdTeams[t.name] = team;
  }

  // Assign Team Members
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: createdTeams['Core Platform Engineering'].id, userId: createdUsers['ayush@syntrix.io'].id } },
    update: { role: TeamRole.LEAD },
    create: { teamId: createdTeams['Core Platform Engineering'].id, userId: createdUsers['ayush@syntrix.io'].id, role: TeamRole.LEAD },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: createdTeams['Core Platform Engineering'].id, userId: createdUsers['marcus@syntrix.io'].id } },
    update: { role: TeamRole.MEMBER },
    create: { teamId: createdTeams['Core Platform Engineering'].id, userId: createdUsers['marcus@syntrix.io'].id, role: TeamRole.MEMBER },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: createdTeams['Product Experience'].id, userId: createdUsers['sophia@syntrix.io'].id } },
    update: { role: TeamRole.LEAD },
    create: { teamId: createdTeams['Product Experience'].id, userId: createdUsers['sophia@syntrix.io'].id, role: TeamRole.LEAD },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: createdTeams['Infrastructure & SRE'].id, userId: createdUsers['david@syntrix.io'].id } },
    update: { role: TeamRole.LEAD },
    create: { teamId: createdTeams['Infrastructure & SRE'].id, userId: createdUsers['david@syntrix.io'].id, role: TeamRole.LEAD },
  });

  // 5. Create Organization Labels
  const labelsData = [
    { name: 'Backend', color: '#f5ae4d', description: 'API services & persistence logic' },
    { name: 'Frontend', color: '#719879', description: 'UI components & client state' },
    { name: 'Security', color: '#c96d57', description: 'Auth, RBAC & cryptography' },
    { name: 'DevOps', color: '#817d73', description: 'Containers, deployment & pipelines' },
    { name: 'Design', color: '#d9963d', description: 'Tokens, ergonomics & layout' },
    { name: 'Urgent', color: '#d47a62', description: 'Blocking critical path' },
  ];

  const createdLabels: Record<string, any> = {};
  for (const l of labelsData) {
    let label = await prisma.label.findFirst({
      where: { organizationId: org.id, name: l.name },
    });
    if (!label) {
      label = await prisma.label.create({
        data: {
          organizationId: org.id,
          name: l.name,
          color: l.color,
          description: l.description,
        },
      });
    }
    createdLabels[l.name] = label;
  }

  // 6. Create Projects
  const projectsData = [
    {
      key: 'SYN',
      name: 'Syntrix Core Platform',
      description: 'Next-generation real-time multi-tenant collaboration engine with granular RBAC and sub-second messaging.',
      status: ProjectStatus.ACTIVE,
      priority: ProjectPriority.HIGH,
      teamId: createdTeams['Core Platform Engineering'].id,
    },
    {
      key: 'MOB',
      name: 'Syntrix Mobile iOS & Android',
      description: 'Native mobile client with offline-first caching, biometric authentication, and push notifications.',
      status: ProjectStatus.ACTIVE,
      priority: ProjectPriority.MEDIUM,
      teamId: createdTeams['Product Experience'].id,
    },
    {
      key: 'INF',
      name: 'Cloud Infrastructure 2.0',
      description: 'Multi-region MariaDB replication, Redis cluster caching, and automated Blue-Green deployments.',
      status: ProjectStatus.ACTIVE,
      priority: ProjectPriority.URGENT,
      teamId: createdTeams['Infrastructure & SRE'].id,
    },
    {
      key: 'ANL',
      name: 'Enterprise Analytics Engine',
      description: 'Real-time velocity tracking, burndown projections, and custom timespan visualization pipelines.',
      status: ProjectStatus.ACTIVE,
      priority: ProjectPriority.MEDIUM,
      teamId: createdTeams['Core Platform Engineering'].id,
    },
  ];

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
          key: p.key,
          name: p.name,
          description: p.description,
          status: p.status,
          priority: p.priority,
          teamId: p.teamId,
        },
      });
    }

    // Add all team members to project
    for (const u of Object.values(createdUsers)) {
      const isLead = u.email === 'ayush@syntrix.io' || u.email === 'elena@syntrix.io';
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: proj.id,
            userId: u.id,
          },
        },
        update: { role: isLead ? ProjectRole.LEAD : ProjectRole.MEMBER },
        create: {
          projectId: proj.id,
          userId: u.id,
          role: isLead ? ProjectRole.LEAD : ProjectRole.MEMBER,
        },
      });
    }

    // Create Default Board and Columns
    let board = await prisma.board.findFirst({
      where: { projectId: proj.id, isDefault: true },
    });

    if (!board) {
      board = await prisma.board.create({
        data: {
          projectId: proj.id,
          name: 'Main Kanban Flow',
          description: 'Primary workflow board',
          isDefault: true,
        },
      });

      const cols = [
        { name: 'Backlog', position: 1, color: '#817D73' },
        { name: 'In Progress', position: 2, color: '#F5AE4D' },
        { name: 'Code Review', position: 3, color: '#D9963D' },
        { name: 'QA & Verification', position: 4, color: '#719879' },
        { name: 'Done', position: 5, color: '#719879' },
      ];

      for (const col of cols) {
        await prisma.boardColumn.create({
          data: {
            boardId: board.id,
            name: col.name,
            position: col.position,
            color: col.color,
          },
        });
      }
    }

    // Fetch board columns
    const columns = await prisma.boardColumn.findMany({
      where: { boardId: board.id },
      orderBy: { position: 'asc' },
    });

    // Create Sprints for SYN project
    if (p.key === 'SYN') {
      let s1 = await prisma.sprint.findFirst({ where: { projectId: proj.id, name: 'Sprint 1: Architecture & Foundation' } });
      if (!s1) {
        s1 = await prisma.sprint.create({
          data: {
            projectId: proj.id,
            name: 'Sprint 1: Architecture & Foundation',
            goal: 'Setup MVC service layer, MariaDB schema migrations, and JWT token rotation',
            status: SprintStatus.COMPLETED,
            startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      let s2 = await prisma.sprint.findFirst({ where: { projectId: proj.id, name: 'Sprint 2: Real-Time Boards & Analytics' } });
      if (!s2) {
        s2 = await prisma.sprint.create({
          data: {
            projectId: proj.id,
            name: 'Sprint 2: Real-Time Boards & Analytics',
            goal: 'Implement adaptive Bar/Line charts, sprint burndown, and drag-and-drop kanban',
            status: SprintStatus.ACTIVE,
            startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          },
        });
      }

      let s3 = await prisma.sprint.findFirst({ where: { projectId: proj.id, name: 'Sprint 3: Enterprise SSO & Mobile Sync' } });
      if (!s3) {
        s3 = await prisma.sprint.create({
          data: {
            projectId: proj.id,
            name: 'Sprint 3: Enterprise SSO & Mobile Sync',
            goal: 'SAML 2.0 / OIDC integrations and WebSocket connection multiplexing',
            status: SprintStatus.PLANNED,
            startDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Realistic Tasks for SYN
      const tasksSeed = [
        {
          number: 1,
          title: 'Implement token refresh rotation & reuse detection',
          description: 'Ensure compromised refresh tokens automatically revoke child token families using Redis blacklisting.',
          status: TaskStatus.DONE,
          priority: TaskPriority.URGENT,
          colIdx: 4,
          assignee: createdUsers['ayush@syntrix.io'],
          reporter: createdUsers['elena@syntrix.io'],
          labels: [createdLabels['Backend'], createdLabels['Security']],
          sprintId: s1.id,
          hours: 12,
        },
        {
          number: 2,
          title: 'Build adaptive Bklit UI Bar & Line chart engines',
          description: 'Dynamically render monotonic splines for >14d spans with 2-day axis spacing intervals.',
          status: TaskStatus.DONE,
          priority: TaskPriority.HIGH,
          colIdx: 4,
          assignee: createdUsers['marcus@syntrix.io'],
          reporter: createdUsers['ayush@syntrix.io'],
          labels: [createdLabels['Frontend'], createdLabels['Design']],
          sprintId: s2.id,
          hours: 16,
        },
        {
          number: 3,
          title: 'Design mobile responsive sidebar navigation drawer',
          description: 'Implement off-canvas hamburger drawer with backdrop blur and touch gesture support.',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          colIdx: 1,
          assignee: createdUsers['sophia@syntrix.io'],
          reporter: createdUsers['ayush@syntrix.io'],
          labels: [createdLabels['Frontend'], createdLabels['Design']],
          sprintId: s2.id,
          hours: 8,
        },
        {
          number: 4,
          title: 'Setup automated Vitest suite for middleware & services',
          description: 'Cover JWT validation, Zod request sanitization, and error boundary responses.',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          colIdx: 1,
          assignee: createdUsers['aisha@syntrix.io'],
          reporter: createdUsers['elena@syntrix.io'],
          labels: [createdLabels['Backend'], createdLabels['DevOps']],
          sprintId: s2.id,
          hours: 10,
        },
        {
          number: 5,
          title: 'Configure MariaDB connection pool & Prometheus exporter',
          description: 'Tune max open connections to 50 and export latency metrics at /metrics endpoint.',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          colIdx: 0,
          assignee: createdUsers['david@syntrix.io'],
          reporter: createdUsers['ayush@syntrix.io'],
          labels: [createdLabels['DevOps'], createdLabels['Backend']],
          sprintId: s2.id,
          hours: 6,
        },
        {
          number: 6,
          title: 'Audit WCAG AA color contrast & focus ring styling',
          description: 'Verify 3px amber focus rings on all interactive elements across dark and light surfaces.',
          status: TaskStatus.REVIEW,
          priority: TaskPriority.LOW,
          colIdx: 2,
          assignee: createdUsers['sophia@syntrix.io'],
          reporter: createdUsers['marcus@syntrix.io'],
          labels: [createdLabels['Frontend'], createdLabels['Design']],
          sprintId: s2.id,
          hours: 4,
        },
      ];

      for (const t of tasksSeed) {
        const key = `${p.key}-${t.number}`;
        const targetCol = columns[t.colIdx] || columns[0];

        const createdTask = await prisma.task.upsert({
          where: { projectId_number: { projectId: proj.id, number: t.number } },
          update: {
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            columnId: targetCol.id,
            assigneeId: t.assignee.id,
            reporterId: t.reporter.id,
            sprintId: t.sprintId,
            estimatedHours: t.hours,
          },
          create: {
            projectId: proj.id,
            columnId: targetCol.id,
            number: t.number,
            key,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            position: t.number * 1000.0,
            assigneeId: t.assignee.id,
            reporterId: t.reporter.id,
            sprintId: t.sprintId,
            estimatedHours: t.hours,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          },
        });

        // Add task labels
        for (const lbl of t.labels) {
          if (lbl) {
            await prisma.taskLabel.upsert({
              where: { taskId_labelId: { taskId: createdTask.id, labelId: lbl.id } },
              update: {},
              create: { taskId: createdTask.id, labelId: lbl.id },
            });
          }
        }
      }
    }
  }

  console.log('🎉 Syntrix database successfully seeded with realistic enterprise data!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
