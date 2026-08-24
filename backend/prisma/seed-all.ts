import {
  UserRole,
  OrganizationRole,
  TeamRole,
  ProjectRole,
  ProjectStatus,
  ProjectPriority,
  TaskStatus,
  TaskPriority,
  SprintStatus,
} from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma';

async function main() {
  console.log('🔍 Inspecting and populating all workspaces...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. All Users (including Alex Mercer and Ayush Singh and teammates)
  const usersList = [
    {
      name: 'Alex Mercer',
      email: 'alex@syntrix.com',
      role: UserRole.ADMIN,
      bio: 'Lead System Architect & Core Platform Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Ayush Singh',
      email: 'ayush@syntrix.io',
      role: UserRole.ADMIN,
      bio: 'Founder & Principal Engineer @ Syntrix Labs',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
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
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
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
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Aisha Patel',
      email: 'aisha@syntrix.io',
      role: UserRole.USER,
      bio: 'Senior QA Automation & Test Infrastructure Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const dbUsers: Record<string, any> = {};
  for (const u of usersList) {
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
    dbUsers[u.email] = user;
  }

  // 2. Fetch all existing organizations in DB
  const allOrgs = await prisma.organization.findMany();
  console.log(`Found ${allOrgs.length} organizations in database:`, allOrgs.map((o) => o.name));

  // If Syntrix Platform doesn't exist, create it
  let syntrixPlatform = allOrgs.find((o) => o.slug === 'syntrix-platform');
  if (!syntrixPlatform) {
    syntrixPlatform = await prisma.organization.create({
      data: {
        name: 'Syntrix Platform',
        slug: 'syntrix-platform',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      },
    });
  }

  // Populate data for EVERY organization in the database so no matter what org the user is viewing, it's rich!
  const targetOrgs = await prisma.organization.findMany();

  for (const org of targetOrgs) {
    console.log(`\n🏢 Seeding data into Organization: ${org.name} (${org.slug})...`);

    // A. Add all users to this organization
    for (const [email, user] of Object.entries(dbUsers)) {
      const isOwner = email === 'alex@syntrix.com' || email === 'ayush@syntrix.io';
      await prisma.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: user.id,
          },
        },
        update: {
          role: isOwner ? OrganizationRole.OWNER : OrganizationRole.MEMBER,
        },
        create: {
          organizationId: org.id,
          userId: user.id,
          role: isOwner ? OrganizationRole.OWNER : OrganizationRole.MEMBER,
        },
      });
    }

    // B. Organization Teams
    const teamsToCreate = [
      { name: 'Core Engineering', description: 'Backend distributed systems, microservices & infrastructure engine' },
      { name: 'Product & Design', description: 'Design systems, web ergonomics, and user experience workflows' },
      { name: 'Infrastructure & SRE', description: 'Kubernetes orchestration, CI/CD pipelines, and observability' },
      { name: 'QA & Automation', description: 'Automated test pipelines, load testing, and regression suites' },
    ];

    const teamMap: Record<string, any> = {};
    for (const t of teamsToCreate) {
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
      teamMap[t.name] = team;

      // Add members to team
      for (const user of Object.values(dbUsers)) {
        await prisma.teamMember.upsert({
          where: { teamId_userId: { teamId: team.id, userId: user.id } },
          update: {},
          create: {
            teamId: team.id,
            userId: user.id,
            role: user.email === 'alex@syntrix.com' || user.email === 'ayush@syntrix.io' ? TeamRole.LEAD : TeamRole.MEMBER,
          },
        });
      }
    }

    // C. Organization Labels
    const labelsData = [
      { name: 'Backend', color: '#f5ae4d', description: 'API services & persistence logic' },
      { name: 'Frontend', color: '#719879', description: 'UI components & client state' },
      { name: 'Security', color: '#c96d57', description: 'Auth, RBAC & cryptography' },
      { name: 'DevOps', color: '#817d73', description: 'Containers, deployment & pipelines' },
      { name: 'Design', color: '#d9963d', description: 'Tokens, ergonomics & layout' },
      { name: 'Urgent', color: '#d47a62', description: 'Blocking critical path' },
    ];

    const labelMap: Record<string, any> = {};
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
      labelMap[l.name] = label;
    }

    // D. Projects
    const projectsList = [
      {
        key: 'SYN',
        name: 'Syntrix Core Engine',
        description: 'Primary high-throughput event processing and multi-tenant workspace platform',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        teamId: teamMap['Core Engineering']?.id,
      },
      {
        key: 'WEB',
        name: 'Syntrix Web Client 2.0',
        description: 'Warm design system, real-time board reactivity, and responsive mobile drawers',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        teamId: teamMap['Product & Design']?.id,
      },
      {
        key: 'OPS',
        name: 'Infrastructure & Cluster SRE',
        description: 'MariaDB replication clusters, Redis rate-limiting, and Blue-Green zero-downtime deploys',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.URGENT,
        teamId: teamMap['Infrastructure & SRE']?.id,
      },
      {
        key: 'ANL',
        name: 'Enterprise Analytics & BI',
        description: 'Real-time velocity tracking, burndown projections, and custom timespan visualization pipelines',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.MEDIUM,
        teamId: teamMap['Core Engineering']?.id,
      },
    ];

    for (const p of projectsList) {
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
      } else {
        await prisma.project.update({
          where: { id: proj.id },
          data: {
            name: p.name,
            description: p.description,
            status: p.status,
            priority: p.priority,
            teamId: p.teamId,
          },
        });
      }

      // Add ALL users to this project
      for (const u of Object.values(dbUsers)) {
        const isLead = u.email === 'alex@syntrix.com' || u.email === 'ayush@syntrix.io' || u.email === 'elena@syntrix.io';
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

      // Board & Columns
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
          { name: 'QA & Testing', position: 4, color: '#719879' },
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

      const columns = await prisma.boardColumn.findMany({
        where: { boardId: board.id },
        orderBy: { position: 'asc' },
      });

      // Sprints
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

      // Tasks for the project
      const sampleTasks = [
        {
          number: 1,
          title: 'Implement token refresh rotation & reuse detection',
          description: 'Ensure compromised refresh tokens automatically revoke child token families using Redis blacklisting.',
          status: TaskStatus.DONE,
          priority: TaskPriority.URGENT,
          colIdx: 4,
          assignee: dbUsers['alex@syntrix.com'],
          reporter: dbUsers['elena@syntrix.io'],
          labels: [labelMap['Backend'], labelMap['Security']],
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
          assignee: dbUsers['marcus@syntrix.io'],
          reporter: dbUsers['alex@syntrix.com'],
          labels: [labelMap['Frontend'], labelMap['Design']],
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
          assignee: dbUsers['sophia@syntrix.io'],
          reporter: dbUsers['alex@syntrix.com'],
          labels: [labelMap['Frontend'], labelMap['Design']],
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
          assignee: dbUsers['aisha@syntrix.io'],
          reporter: dbUsers['elena@syntrix.io'],
          labels: [labelMap['Backend'], labelMap['DevOps']],
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
          assignee: dbUsers['david@syntrix.io'],
          reporter: dbUsers['alex@syntrix.com'],
          labels: [labelMap['DevOps'], labelMap['Backend']],
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
          assignee: dbUsers['sophia@syntrix.io'],
          reporter: dbUsers['marcus@syntrix.io'],
          labels: [labelMap['Frontend'], labelMap['Design']],
          sprintId: s2.id,
          hours: 4,
        },
      ];

      for (const t of sampleTasks) {
        const key = `${p.key}-${t.number}`;
        const targetCol = columns[t.colIdx] || columns[0];

        const createdTask = await prisma.task.upsert({
          where: { projectId_number: { projectId: proj.id, number: t.number } },
          update: {
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            columnId: targetCol?.id,
            assigneeId: t.assignee?.id,
            reporterId: t.reporter?.id,
            sprintId: t.sprintId,
            estimatedHours: t.hours,
          },
          create: {
            projectId: proj.id,
            columnId: targetCol?.id,
            number: t.number,
            key,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            position: t.number * 1000.0,
            assigneeId: t.assignee?.id,
            reporterId: t.reporter?.id,
            sprintId: t.sprintId,
            estimatedHours: t.hours,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          },
        });

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

  console.log('🎉 Successfully seeded ALL workspaces with full enterprise data and team members!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
