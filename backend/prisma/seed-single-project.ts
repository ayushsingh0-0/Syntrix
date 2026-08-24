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
  ActivityAction,
} from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma';

async function main() {
  console.log('🧹 Cleaning and rebuilding Syntrix Labs Inc. with a SINGLE flagship project...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Ensure 5 Core Users exist
  const coreUsers = [
    {
      name: 'Ayush Singh',
      email: 'ayush@syntrix.io',
      role: UserRole.ADMIN,
      bio: 'Lead System Architect & Founder — Distributed Systems, Node.js, MariaDB & Redis',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Elena Rostova',
      email: 'elena@syntrix.io',
      role: UserRole.MANAGER,
      bio: 'VP of Engineering — Backend Concurrency, Security Architecture & Micro-Queues',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus@syntrix.io',
      role: UserRole.USER,
      bio: 'Senior Fullstack Engineer — React 19, Optimistic State Sync & 60fps Kanban Motion',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sophia Chen',
      email: 'sophia@syntrix.io',
      role: UserRole.USER,
      bio: 'Staff Product Designer & Design Technologist — Warm Sand Theme & WCAG AA Ergonomics',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'David Kim',
      email: 'david@syntrix.io',
      role: UserRole.USER,
      bio: 'Lead SRE & Platform Operations — Docker Multi-Stage, NGINX Upstreams & Cloud IaC',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const userMap: Record<string, any> = {};
  for (const u of coreUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        password: passwordHash,
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
    userMap[u.email] = user;
  }

  // 2. Fetch Syntrix Labs Inc.
  const org = await prisma.organization.findUnique({
    where: { slug: 'syntrix-labs' },
  });

  if (!org) {
    console.error('Organization syntrix-labs not found!');
    return;
  }

  // 3. Ensure Ayush Singh is OWNER of Syntrix Labs Inc.
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: userMap['ayush@syntrix.io'].id,
      },
    },
    update: { role: OrganizationRole.OWNER },
    create: {
      organizationId: org.id,
      userId: userMap['ayush@syntrix.io'].id,
      role: OrganizationRole.OWNER,
    },
  });

  // Enroll other 4 members
  const otherMembers = [
    { email: 'elena@syntrix.io', role: OrganizationRole.ADMIN },
    { email: 'marcus@syntrix.io', role: OrganizationRole.MANAGER },
    { email: 'sophia@syntrix.io', role: OrganizationRole.MEMBER },
    { email: 'david@syntrix.io', role: OrganizationRole.MEMBER },
  ];

  for (const m of otherMembers) {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: userMap[m.email].id,
        },
      },
      update: { role: m.role },
      create: {
        organizationId: org.id,
        userId: userMap[m.email].id,
        role: m.role,
      },
    });
  }

  // 4. Delete all existing projects in Syntrix Labs Inc. except 'SYN' (or delete all and recreate cleanly)
  const existingProjects = await prisma.project.findMany({
    where: { organizationId: org.id },
  });

  console.log(`Found ${existingProjects.length} existing projects in Syntrix Labs. Deleting old projects...`);
  for (const p of existingProjects) {
    await prisma.project.delete({ where: { id: p.id } });
    console.log(`  - Deleted project: ${p.name} (${p.key})`);
  }

  // 5. Create Core Platform Team
  let team = await prisma.team.findFirst({
    where: { organizationId: org.id, name: 'Syntrix Core Engineering' },
  });
  if (!team) {
    team = await prisma.team.create({
      data: {
        organizationId: org.id,
        name: 'Syntrix Core Engineering',
        description: 'Cross-functional engineering team building the Syntrix platform',
      },
    });
  }

  for (const u of Object.values(userMap)) {
    const isLead = u.email === 'ayush@syntrix.io';
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId: u.id } },
      update: { role: isLead ? TeamRole.LEAD : TeamRole.MEMBER },
      create: { teamId: team.id, userId: u.id, role: isLead ? TeamRole.LEAD : TeamRole.MEMBER },
    });
  }

  // 6. Labels
  const labelsData = [
    { name: 'Architecture', color: '#f5ae4d', description: 'Core system structure, MVC layering & schemas' },
    { name: 'Backend', color: '#d9963d', description: 'API services & persistence logic' },
    { name: 'Frontend', color: '#719879', description: 'React 19 UI components & state' },
    { name: 'Security', color: '#c96d57', description: 'Auth, magic bytes scanning & penetration' },
    { name: 'Performance', color: '#e0a34c', description: 'Redis cache-aside & indexing' },
    { name: 'DevOps', color: '#817d73', description: 'Docker, NGINX upstreams & CI/CD' },
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

  // 7. Create SINGLE Flagship Project: "Syntrix" (Key: SYN)
  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      key: 'SYN',
      name: 'Syntrix',
      description: 'Enterprise multi-tenant agile collaboration platform featuring 6-tier MVC architecture, 60fps drag-and-drop Kanban, Redis cache-aside, BullMQ queues, and deep binary security scanning.',
      status: ProjectStatus.ACTIVE,
      priority: ProjectPriority.URGENT,
      teamId: team.id,
    },
  });

  console.log(`✅ Created Single Flagship Project: ${project.name} (${project.key})`);

  // Add all 5 members to project
  for (const u of Object.values(userMap)) {
    const isLead = u.email === 'ayush@syntrix.io' || u.email === 'elena@syntrix.io';
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: u.id,
        role: isLead ? ProjectRole.LEAD : ProjectRole.MEMBER,
      },
    });
  }

  // 8. Board & 5 Columns
  const board = await prisma.board.create({
    data: {
      projectId: project.id,
      name: 'Syntrix Agile Workflow',
      description: 'Primary Kanban board for sprint execution',
      isDefault: true,
    },
  });

  const columnsData = [
    { name: 'Backlog', position: 1, color: '#817D73' },
    { name: 'In Progress', position: 2, color: '#F5AE4D' },
    { name: 'Code Review', position: 3, color: '#D9963D' },
    { name: 'QA & Verification', position: 4, color: '#719879' },
    { name: 'Done', position: 5, color: '#719879' },
  ];

  const colMap: Record<string, any> = {};
  for (const c of columnsData) {
    const col = await prisma.boardColumn.create({
      data: {
        boardId: board.id,
        name: c.name,
        position: c.position,
        color: c.color,
      },
    });
    colMap[c.name] = col;
  }

  // 9. Create 5 Agile Sprints
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const s1 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 1: Architecture & Foundation',
      goal: 'Design 6-tier MVC+Service Layer, configure MariaDB relational schemas with Prisma, and implement JWT dual-token family rotation.',
      status: SprintStatus.COMPLETED,
      startDate: new Date(now - 30 * day),
      endDate: new Date(now - 16 * day),
      completedAt: new Date(now - 16 * day),
    },
  });

  const s2 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 2: Real-Time Kanban & Drag-and-Drop',
      goal: 'Build 60fps direct card manipulation with optimistic UI updates, auto-rollback on failure, DAG dependency cycle prevention, and threaded discussions.',
      status: SprintStatus.COMPLETED,
      startDate: new Date(now - 15 * day),
      endDate: new Date(now - 2 * day),
      completedAt: new Date(now - 2 * day),
    },
  });

  const s3 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 3: High-Performance Engine & Caching',
      goal: 'Implement Redis Cache-Aside pattern, compound database index tuning, cursor-based seek pagination, and BullMQ background workers.',
      status: SprintStatus.COMPLETED,
      startDate: new Date(now - 7 * day),
      endDate: new Date(now - 1 * day),
      completedAt: new Date(now - 1 * day),
    },
  });

  const s4 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 4: Enterprise Security & File Defense',
      goal: 'Deploy deep binary magic byte verification, strict extension allowlists, Helmet HTTP headers, CSRF origin verification, and automated penetration test suites.',
      status: SprintStatus.ACTIVE,
      startDate: new Date(now - 1 * day),
      endDate: new Date(now + 12 * day),
    },
  });

  const s5 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 5: Cloud Deployment & Reliability',
      goal: 'Package multi-stage Dockerfiles, NGINX keepalive upstreams, Render IaC blueprints, and automated database disaster recovery drills.',
      status: SprintStatus.PLANNED,
      startDate: new Date(now + 13 * day),
      endDate: new Date(now + 27 * day),
    },
  });

  // 10. Seed 15 Tasks
  const taskSeeds = [
    {
      number: 1,
      title: 'Architect 6-tier MVC + Service Layer & request lifecycle boundary',
      description: 'Establish clean architectural boundaries separating Controllers (HTTP parsing), Services (business logic & transactions), and Repositories (Prisma queries) to prevent bloated controllers and coupled data access.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      column: colMap['Done'],
      sprintId: s1.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['elena@syntrix.io'],
      storyPoints: 8,
      hours: 18,
      labels: [labelMap['Architecture'], labelMap['Backend']],
      comments: [
        {
          user: userMap['elena@syntrix.io'],
          content: 'The separation between Service orchestration and Repository queries looks very clean. This makes unit testing our business rules with mocked repositories completely seamless.',
        },
        {
          user: userMap['ayush@syntrix.io'],
          content: 'Agreed! All domain services now throw standardized ApiError instances caught by centralized error middleware, guaranteeing uniform JSON error responses across all 30+ endpoints.',
        },
      ],
    },
    {
      number: 2,
      title: 'Implement JWT refresh token family rotation & reuse attack detection',
      description: 'Configure dual-token authentication: short-lived 15m JWT access tokens in memory and 7-day refresh tokens in httpOnly cookies. If a revoked token is replayed, invalidate the entire token family immediately.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      column: colMap['Done'],
      sprintId: s1.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['elena@syntrix.io'],
      storyPoints: 5,
      hours: 12,
      labels: [labelMap['Security'], labelMap['Backend']],
      comments: [
        {
          user: userMap['marcus@syntrix.io'],
          content: 'Tested token refresh interceptor in Axios with 401 retry queue. Seamlessly refreshes without logging the user out during background calls!',
        },
      ],
    },
    {
      number: 3,
      title: 'Model multi-tenant organization schema with composite unique keys',
      description: 'Define MariaDB schema in Prisma with multi-tenant partitioning on organizationId, project keys, task numbers, and composite unique constraints ([organizationId, key], [projectId, number]).',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s1.id,
      assignee: userMap['david@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 10,
      labels: [labelMap['Architecture'], labelMap['Backend']],
    },
    {
      number: 4,
      title: 'Build interactive Kanban Drag-and-Drop with Optimistic UI updates',
      description: 'Implement native HTML5 Drag and Drop handlers with instant 60fps local state movement in React. When card is dropped, immediately transition the card and trigger background PATCH /tasks/:id/move with automatic rollback on network failure.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s2.id,
      assignee: userMap['marcus@syntrix.io'],
      reporter: userMap['sophia@syntrix.io'],
      storyPoints: 8,
      hours: 16,
      labels: [labelMap['Frontend'], labelMap['Architecture']],
      comments: [
        {
          user: userMap['sophia@syntrix.io'],
          content: 'The drag preview tilt (-1.5deg) and pulsing drop-slot placeholder provide incredible tactile feedback. Perceived latency is literally 0ms.',
        },
        {
          user: userMap['marcus@syntrix.io'],
          content: 'Added fractional index positioning (Float) on columns so reordering between two cards only updates a single row in MariaDB instead of shifting every card in the column!',
        },
      ],
    },
    {
      number: 5,
      title: 'Develop DAG task dependency engine with cycle detection algorithm',
      description: 'Prevent circular blocking relationships (e.g. Task A blocks B, B blocks C, C blocks A) using Depth-First Search (DFS) graph traversal before inserting dependency records in TaskDependency table.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s2.id,
      assignee: userMap['elena@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 14,
      labels: [labelMap['Backend'], labelMap['Architecture']],
    },
    {
      number: 6,
      title: 'Implement threaded discussion system with @mention parsing & audit timeline',
      description: 'Support nested comment replies (CommentReplies relation) with regex extraction of @user mentions, automatic notification dispatch, and ActivityLog event recording.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      column: colMap['Done'],
      sprintId: s2.id,
      assignee: userMap['marcus@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 11,
      labels: [labelMap['Backend'], labelMap['Frontend']],
    },
    {
      number: 7,
      title: 'Implement Redis Cache-Aside layer with in-process fallback resilience',
      description: 'Cache workspace KPI summaries, member workloads, and completion velocities in Redis (60s TTL). If Redis is offline or disconnected, gracefully degrade to direct database queries without application crashes.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s3.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['david@syntrix.io'],
      storyPoints: 8,
      hours: 15,
      labels: [labelMap['Performance'], labelMap['Backend']],
      comments: [
        {
          user: userMap['david@syntrix.io'],
          content: 'Benchmark tests show dashboard analytics query execution dropped from 140ms down to 4ms on cache hits!',
        },
      ],
    },
    {
      number: 8,
      title: 'Add cursor-based seek pagination for high-volume task feeds',
      description: 'Support O(1) cursor pagination (take: limit, cursor: { id }, skip: 1) alongside offset pagination to avoid deep table scan degradation on large task rosters.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      column: colMap['Done'],
      sprintId: s3.id,
      assignee: userMap['elena@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 9,
      labels: [labelMap['Performance'], labelMap['Backend']],
    },
    {
      number: 9,
      title: 'Deploy binary magic byte inspection & malicious extension blocking',
      description: 'Inspect initial 8 header bytes (magic numbers) of uploaded files to verify true binary signatures (PNG, JPG, PDF, ZIP, WebP) and reject spoofed executables (.exe, .sh, .bat, .php, .js) with path traversal sanitization.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      column: colMap['Done'],
      sprintId: s4.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['elena@syntrix.io'],
      storyPoints: 5,
      hours: 8,
      labels: [labelMap['Security'], labelMap['Backend']],
      comments: [
        {
          user: userMap['elena@syntrix.io'],
          content: 'Verified with security penetration test suite in Vitest. Renamed .exe payloads disguised as .png are rejected immediately before saving to storage.',
        },
      ],
    },
    {
      number: 10,
      title: 'Configure Helmet HTTP security headers & strict CORS origin whitelisting',
      description: 'Enforce X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy, COOP, CORP, and HSTS. Restrict CORS to verified client origins with preflight caching.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      column: colMap['In Progress'],
      sprintId: s4.id,
      assignee: userMap['david@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 3,
      hours: 6,
      labels: [labelMap['Security'], labelMap['DevOps']],
    },
    {
      number: 11,
      title: 'Implement CSRF safe-request verification middleware on state mutations',
      description: 'Guard POST, PUT, PATCH, and DELETE endpoints against Cross-Site Request Forgery with origin and referer header verification matching trusted frontend clients.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      column: colMap['In Progress'],
      sprintId: s4.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['marcus@syntrix.io'],
      storyPoints: 3,
      hours: 5,
      labels: [labelMap['Security'], labelMap['Backend']],
    },
    {
      number: 12,
      title: 'Audit WCAG AA compliance, amber focus rings & screen reader semantics',
      description: 'Inspect all interactive buttons, modals, dropdowns, and form inputs for 3px amber focus rings (rgba(245, 174, 77, 0.22)) and proper ARIA role attributes.',
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      column: colMap['Code Review'],
      sprintId: s4.id,
      assignee: userMap['sophia@syntrix.io'],
      reporter: userMap['marcus@syntrix.io'],
      storyPoints: 3,
      hours: 6,
      labels: [labelMap['Frontend']],
    },
    {
      number: 13,
      title: 'Execute automated security penetration & authorization abuse test suite',
      description: 'Run Vitest penetration tests covering horizontal tenant cross-access, vertical role privilege escalation, password hash stripping, and token revocation.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      column: colMap['Backlog'],
      sprintId: s4.id,
      assignee: userMap['elena@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 8,
      labels: [labelMap['Security'], labelMap['Backend']],
    },
    {
      number: 14,
      title: 'Containerize backend & frontend with multi-stage Dockerfiles',
      description: 'Build production Dockerfile for backend on Node 22 Alpine with non-root security user, and frontend Dockerfile on NGINX Alpine with SPA fallback routing.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      column: colMap['Backlog'],
      sprintId: s5.id,
      assignee: userMap['david@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 10,
      labels: [labelMap['DevOps']],
    },
    {
      number: 15,
      title: 'Configure NGINX reverse proxy with upstream keepalive connection pooling',
      description: 'Setup NGINX upstream backend_cluster with 32 keepalive connections, 1-year immutable caching on static JS/CSS assets, and /health liveness routing.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      column: colMap['Backlog'],
      sprintId: s5.id,
      assignee: userMap['david@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 3,
      hours: 6,
      labels: [labelMap['DevOps']],
    },
  ];

  for (const t of taskSeeds) {
    const key = `SYN-${t.number}`;

    const createdTask = await prisma.task.create({
      data: {
        projectId: project.id,
        columnId: t.column.id,
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
        storyPoints: t.storyPoints,
        estimatedHours: t.hours,
        dueDate: new Date(now + 6 * day),
      },
    });

    for (const lbl of t.labels) {
      if (lbl) {
        await prisma.taskLabel.create({
          data: { taskId: createdTask.id, labelId: lbl.id },
        });
      }
    }

    if (t.comments && t.comments.length > 0) {
      for (const c of t.comments) {
        await prisma.comment.create({
          data: {
            taskId: createdTask.id,
            userId: c.user.id,
            content: c.content,
          },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        organizationId: org.id,
        projectId: project.id,
        taskId: createdTask.id,
        userId: t.assignee.id,
        action: ActivityAction.TASK_CREATED,
        details: {
          title: t.title,
          key,
          priority: t.priority,
          status: t.status,
        },
      },
    });
  }

  console.log(`\n🎉 Syntrix Labs Inc. now contains ONLY the single flagship project "Syntrix" with 15 rich tasks and 5 sprints!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
